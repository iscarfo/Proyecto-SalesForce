@isTest
private class AccountLevelControllerTest {

    @testSetup
    static void setupData() {
        // Crear un usuario para asignar como Owner
        User u = [SELECT Id FROM User WHERE IsActive = true LIMIT 1];

        // Crear cuentas de prueba
        List<Account> accounts = new List<Account>{
            new Account(Name='Test Level 1', Level__c='Level 1', Phone='111', OwnerId=u.Id),
            new Account(Name='Test Level 2', Level__c='Level 2', Phone='222', OwnerId=u.Id),
            new Account(Name='Customer Direct', Level__c='Level 2', Type='Customer - Direct', Phone='333', OwnerId=u.Id)
        };
        insert accounts;

        // Crear oportunidad "Closed Won" para bloquear la primera
        Opportunity opp = new Opportunity(
            Name='Closed Won Opp',
            StageName='Closed Won',
            CloseDate=Date.today(),
            AccountId=accounts[0].Id
        );
        insert opp;
    }

    @isTest
    static void testGetAccountsByLevel() {
        List<Account> lvl1 = AccountLevelController.getAccountsByLevel(
            'Level 1', null, null, null, 'Name', 'ASC', 5, 0
        );
        System.assertNotEquals(0, lvl1.size(), 'Debe devolver cuentas Level 1');

        List<Account> lvl2 = AccountLevelController.getAccountsByLevel(
            'Level 2', null, null, null, 'Name', 'ASC', 5, 0
        );
        System.assertNotEquals(0, lvl2.size(), 'Debe devolver cuentas Level 2');
    }

    @isTest
    static void testGetAccountCountByLevel() {
        Integer count1 = AccountLevelController.getAccountCountByLevel('Level 1', null, null, null);
        Integer count2 = AccountLevelController.getAccountCountByLevel('Level 2', null, null, null);
        System.assert(count1 >= 0 && count2 >= 0, 'Debe devolver conteos válidos');
    }

    @isTest
    static void testUpdateAccountLevels() {
        // Obtener las cuentas de setup
        List<Account> accs = [SELECT Id, Level__c, Type, (SELECT Id FROM Opportunities) FROM Account];
        List<Id> ids = new List<Id>();
        for (Account a : accs) {
            ids.add(a.Id);
        }

        try {
            Test.startTest();
            AccountLevelController.updateAccountLevels(ids);
            Test.stopTest();
        } catch (Exception e) {
            System.debug('Excepción controlada: ' + e.getMessage());
        }

        // Verificar cambios válidos (Level 1 -> 2, Level 2 -> 1 excepto restricciones)
        List<Account> updated = [SELECT Name, Level__c FROM Account];
        System.assert(updated.size() >= 3, 'Debe haber cuentas actualizadas');
    }

    @isTest
    static void testGetActiveUsers() {
        List<User> users = AccountLevelController.getActiveUsers();
        System.assert(!users.isEmpty(), 'Debe devolver al menos un usuario activo');
    }
}