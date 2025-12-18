public with sharing class AccountLevelController {

    /**
     * @description Recupera una lista paginada de Cuentas según un nivel y filtros.
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountsByLevel(
        String level, String nameFilter, String phoneFilter, Id ownerId,
        String sortBy, String sortDirection, Integer pageSize, Integer offset
    ) {
        // Construir la cláusula WHERE usando el método privado centralizado
        String whereClause = buildWhereClause(level, nameFilter, phoneFilter, ownerId);

        // Mapeo de campos seguros para ORDER BY para prevenir inyección SOQL
        Map<String, String> sortFields = new Map<String, String>{
            'accountUrl' => 'Name',
            'Name' => 'Name',
            'LastModifiedByName' => 'LastModifiedDate'
        };
        String safeSortBy = sortFields.containsKey(sortBy) ? sortFields.get(sortBy) : 'LastModifiedDate';
        String safeSortDirection = (String.isNotBlank(sortDirection) && sortDirection.toUpperCase() == 'ASC') ? 'ASC' : 'DESC';

        // Construir la consulta principal
        String query = 'SELECT Id, Name, Phone, Level__c, LastModifiedBy.Name, Owner.Name ' +
                       'FROM Account ' +
                       'WHERE ' + whereClause +
                       ' ORDER BY ' + safeSortBy + ' ' + safeSortDirection + ', Id ';

        // Añadir paginación (LIMIT / OFFSET)
        if (pageSize != null && pageSize > 0) {
            query += 'LIMIT ' + pageSize + ' ';
            if (offset != null && offset >= 0) {
                query += 'OFFSET ' + offset;
            }
        }
        return Database.query(query);
    }

    /**
     * @description Devuelve el conteo total de Cuentas que coinciden con los filtros.
     */
    @AuraEnabled(cacheable=true)
    public static Integer getAccountCountByLevel(String level, String nameFilter, String phoneFilter, Id ownerId) {
        // Usar el mismo método privado para construir el WHERE asegura consistencia con la consulta principal
        String whereClause = buildWhereClause(level, nameFilter, phoneFilter, ownerId);
        String countQuery = 'SELECT COUNT() FROM Account WHERE ' + whereClause;
        return Database.countQuery(countQuery);
    }

    /**
     * @description Lógica centralizada para construir la cláusula WHERE de forma segura.
     * @return String con las condiciones concatenadas por 'AND'.
     */
    private static String buildWhereClause(String level, String nameFilter, String phoneFilter, Id ownerId) {
        List<String> conditions = new List<String>();

        if (String.isNotBlank(level)) {
            conditions.add('Level__c = \'' + String.escapeSingleQuotes(level) + '\'');
        } else {
            conditions.add('Level__c != NULL');
        }

        if (String.isNotBlank(nameFilter)) {
            conditions.add('Name LIKE \'%' + String.escapeSingleQuotes(nameFilter) + '%\'');
        }

        if (String.isNotBlank(phoneFilter)) {
            conditions.add('Phone LIKE \'%' + String.escapeSingleQuotes(phoneFilter) + '%\'');
        }

        if (ownerId != null) {
            conditions.add('OwnerId = \'' + String.escapeSingleQuotes(String.valueOf(ownerId)) + '\'');
        }

        return String.join(conditions, ' AND ');
    }
    
    /**
     * @description Actualiza el nivel de las cuentas seleccionadas con validaciones.
     */
    @AuraEnabled
    public static void updateAccountLevels(List<Id> accountIds) {
        List<Account> accountsToProcess = [
            SELECT Id, Name, Level__c, Type,
                   (SELECT Id FROM Opportunities WHERE StageName = 'Closed Won' LIMIT 1)
            FROM Account
            WHERE Id IN :accountIds
        ];

        List<Account> validAccountsToUpdate = new List<Account>();
        List<String> validationErrors = new List<String>();

        for (Account acc : accountsToProcess) {
            String originalLevel = acc.Level__c;
            String newLevel = '';
            Boolean isValid = true;

            if (originalLevel == 'Level 1') {
                newLevel = 'Level 2';
            } else if (originalLevel == 'Level 2') {
                newLevel = 'Level 3';
            } else if (originalLevel == 'Level 3'){
            newLevel = 'Level 1';
            }
            else {
                isValid = false;
                validationErrors.add('Account ' + acc.Name + ' (ID: ' + acc.Id + ') has an unexpected level (' + originalLevel + ') and was skipped.');
            }

            if (isValid) {
                if (!acc.Opportunities.isEmpty()) {
                    isValid = false;
                    validationErrors.add('Cannot update Account ' + acc.Name + ' (ID: ' + acc.Id + '). It has Opportunities in "Closed Won" stage.');
                }
            }

            if (isValid && originalLevel == 'Level 2' && newLevel == 'Level 1') {
                if (acc.Type == 'Customer - Direct') {
                    isValid = false;
                    validationErrors.add('Cannot downgrade Account ' + acc.Name + ' (ID: ' + acc.Id + ') to Level 1. Account Type is "Customer - Direct".');
                }
            }

            if (isValid) {
                acc.Level__c = newLevel;
                validAccountsToUpdate.add(acc);
            }
        }

        if (!validAccountsToUpdate.isEmpty()) {
            Database.SaveResult[] results = Database.update(validAccountsToUpdate, false);
            for (Integer i = 0; i < results.size(); i++) {
                if (!results[i].isSuccess()) {
                    Database.Error err = results[i].getErrors()[0];
                    validationErrors.add('DML Error on Account ' + validAccountsToUpdate[i].Name + ' (ID: ' + validAccountsToUpdate[i].Id + '): ' + err.getMessage());
                }
            }
        }

        if (!validationErrors.isEmpty()) {
            throw new AuraHandledException(String.join(validationErrors, '\n'));
        }
    }

    /**
     * @description Devuelve una lista de todos los usuarios activos.
     */
    @AuraEnabled(cacheable=true)
    public static List<User> getActiveUsers() {
        return [
            SELECT Id, Name 
            FROM User 
            WHERE IsActive = true 
            ORDER BY Name
        ];
    }
}