import { LightningElement, wire, track } from 'lwc';
import getAccountsByLevel from '@salesforce/apex/AccountLevelController.getAccountsByLevel';
import updateAccountLevels from '@salesforce/apex/AccountLevelController.updateAccountLevels';
import getActiveUsers from '@salesforce/apex/AccountLevelController.getActiveUsers';
import getAccountCountByLevel from '@salesforce/apex/AccountLevelController.getAccountCountByLevel';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PAGE_SIZE = 10;

const COLUMNS = [
    {
        label: 'Account Name',
        fieldName: 'accountUrl',
        type: 'url',
        sortable: true, 
        typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
    },
    { label: 'Phone Number', fieldName: 'Phone', type: 'phone' },
    { 
        label: 'Last Modified By', 
        fieldName: 'LastModifiedByName', 
        type: 'text',
        sortable: true
    }
];

export default class AccountLevelManager extends LightningElement {
    columns = COLUMNS;

    @track nameFilterLevel1 = '';
    @track phoneFilterLevel1 = '';
    @track nameFilterLevel2 = '';
    @track phoneFilterLevel2 = '';
    @track ownerIdFilter = null;

    @track nameFilterLevel3 = '';
    @track phoneFilterLevel3 = '';

    @track sortByLevel1 = 'LastModifiedByName'; 
    @track sortDirectionLevel1 = 'DESC'; 
    @track currentPageLevel1 = 1;
    totalRecordsLevel1 = 0;

    @track sortByLevel2 = 'LastModifiedByName'; 
    @track sortDirectionLevel2 = 'DESC';
    @track currentPageLevel2 = 1;

    @track sortByLevel3 = 'LastModifiedByName'; 
    @track sortDirectionLevel3 = 'DESC';
    @track currentPageLevel3 = 1;
    totalRecordsLevel3 = 0;
    totalRecordsLevel2 = 0;
    pageSize = PAGE_SIZE;

    level1Data = [];
    level2Data = [];
    level3Data = [];
    wiredLevel1Result;
    wiredLevel2Result;
    wiredLevel3Result;
    wiredCountLevel1; 
    wiredCountLevel2;
    wiredCountLevel3; 
    selectedLevel1Ids = [];
    selectedLevel2Ids = [];
    selectedLevel3Ids = [];
    isLoading = false;
    error;
    @track isModalOpen = false;
    @track userOptions = [];
    debounceTimeout;

    get offsetLevel1() {
        return (this.currentPageLevel1 - 1) * this.pageSize;
    }

    get offsetLevel2() {
        return (this.currentPageLevel2 - 1) * this.pageSize;
    }

    get offsetLevel3() {
        return (this.currentPageLevel3 - 1) * this.pageSize;
    }

    get totalPagesLevel1() {
        return this.totalRecordsLevel1 > 0 ? Math.ceil(this.totalRecordsLevel1 / this.pageSize) : 1;
    }

    get totalPagesLevel3() {
        return this.totalRecordsLevel3 > 0 ? Math.ceil(this.totalRecordsLevel3 / this.pageSize) : 1;
    }

    get totalPagesLevel2() {
        return this.totalRecordsLevel2 > 0 ? Math.ceil(this.totalRecordsLevel2 / this.pageSize) : 1;
    }

    get isFirstPageLevel1() { return this.currentPageLevel1 === 1; }
    get isLastPageLevel1() { return this.currentPageLevel1 >= this.totalPagesLevel1 || this.totalRecordsLevel1 === 0; }
    get isFirstPageLevel2() { return this.currentPageLevel2 === 1; }
    get isLastPageLevel2() { return this.currentPageLevel2 >= this.totalPagesLevel2 || this.totalRecordsLevel2 === 0; }

    get isFirstPageLevel3() { return this.currentPageLevel3 === 1; }
    get isLastPageLevel3() { return this.currentPageLevel3 >= this.totalPagesLevel3 || this.totalRecordsLevel3 === 0; }

    get selectedTotalCount() {
        return this.selectedLevel1Ids.length + this.selectedLevel2Ids.length;
    }

    @wire(getActiveUsers)
    wiredUsers({ error, data }) {
        if (data) {
            let options = [{ label: 'All Owners', value: '' }];
            data.forEach(user => {
                options.push({ label: user.Name, value: user.Id });
            });
            this.userOptions = options;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountCountByLevel, { 
        level: 'Level 1', 
        nameFilter: '$nameFilterLevel1',
        phoneFilter: '$phoneFilterLevel1',
        ownerId: '$ownerIdFilter'
    })
    wiredCountLevel1Handler(result) { 
        this.wiredCountLevel1 = result; 
        const { data, error } = result;
        if (data !== undefined) {
            this.totalRecordsLevel1 = data;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountCountByLevel, { 
        level: 'Level 2', 
        nameFilter: '$nameFilterLevel2',
        phoneFilter: '$phoneFilterLevel2',
        ownerId: '$ownerIdFilter'
    })
    wiredCountLevel2Handler(result) { 
        this.wiredCountLevel2 = result; 
        const { data, error } = result;
        if (data !== undefined) {
            this.totalRecordsLevel2 = data;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountCountByLevel, { 
        level: 'Level 3', 
        nameFilter: '$nameFilterLevel3',
        phoneFilter: '$phoneFilterLevel3',
        ownerId: '$ownerIdFilter'
    })
    wiredCountLevel3Handler(result) { 
        this.wiredCountLevel3 = result; 
        const { data, error } = result;
        if (data !== undefined) {
            this.totalRecordsLevel1 = data;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountsByLevel, { 
        level: 'Level 1', 
        nameFilter: '$nameFilterLevel1',
        phoneFilter: '$phoneFilterLevel1',
        ownerId: '$ownerIdFilter',
        sortBy: '$sortByLevel1', 
        sortDirection: '$sortDirectionLevel1', 
        pageSize: PAGE_SIZE, 
        offset: '$offsetLevel1' 
    })
    wiredGetLevel1(result) {
        this.wiredLevel1Result = result;
        const { data, error } = result;
        if (data) {
            this.level1Data = data.map(r => ({
                ...r,
                accountUrl: '/lightning/r/Account/' + r.Id + '/view',
                LastModifiedByName: r.LastModifiedBy ? r.LastModifiedBy.Name : '',
                OwnerName: r.Owner ? r.Owner.Name : ''
            }));
            this.error = undefined;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountsByLevel, {
        level: 'Level 2',
        nameFilter: '$nameFilterLevel2',
        phoneFilter: '$phoneFilterLevel2',
        ownerId: '$ownerIdFilter',
        sortBy: '$sortByLevel2', 
        sortDirection: '$sortDirectionLevel2', 
        pageSize: PAGE_SIZE, 
        offset: '$offsetLevel2' 
    })
    wiredGetLevel2(result) {
        this.wiredLevel2Result = result;
        const { data, error } = result;
        if (data) {
            this.level2Data = data.map(r => ({
                ...r,
                accountUrl: '/lightning/r/Account/' + r.Id + '/view',
                LastModifiedByName: r.LastModifiedBy ? r.LastModifiedBy.Name : '',
                OwnerName: r.Owner ? r.Owner.Name : ''
            }));
            this.error = undefined;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    @wire(getAccountsByLevel, { 
        level: 'Level 3', 
        nameFilter: '$nameFilterLevel3',
        phoneFilter: '$phoneFilterLevel3',
        ownerId: '$ownerIdFilter',
        sortBy: '$sortByLevel3', 
        sortDirection: '$sortDirectionLevel3', 
        pageSize: PAGE_SIZE, 
        offset: '$offsetLevel3' 
    })
    wiredGetLevel3(result) {
        this.wiredLevel3Result = result;
        const { data, error } = result;
        if (data) {
            this.level3Data = data.map(r => ({
                ...r,
                accountUrl: '/lightning/r/Account/' + r.Id + '/view',
                LastModifiedByName: r.LastModifiedBy ? r.LastModifiedBy.Name : '',
                OwnerName: r.Owner ? r.Owner.Name : ''
            }));
            this.error = undefined;
        } else if (error) {
            this.error = this._formatError(error);
        }
    }

    async handleFilterChange(event) {
    const filterLabel = event.target.label;
    const filterValue = event.target.value;
    const level = event.target.dataset.level;

    // Espera un ciclo del event loop (reemplaza setTimeout sin violar LWS)
    await Promise.resolve();

    if (level === '1') {
        if (filterLabel.includes('Name')) this.nameFilterLevel1 = filterValue;
        if (filterLabel.includes('Phone')) this.phoneFilterLevel1 = filterValue;
        this.currentPageLevel1 = 1;
    } else if (level === '2') {
        if (filterLabel.includes('Name')) this.nameFilterLevel2 = filterValue;
        if (filterLabel.includes('Phone')) this.phoneFilterLevel2 = filterValue;
        this.currentPageLevel2 = 1;
    }
    else if (level === '3') {
        if (filterLabel.includes('Name')) this.nameFilterLevel3 = filterValue;
        if (filterLabel.includes('Phone')) this.phoneFilterLevel3 = filterValue;
        this.currentPageLevel3 = 1;
    }
}

    handleOwnerFilterChange(event) {
        this.ownerIdFilter = event.detail.value || null;
        this.currentPageLevel1 = 1; 
        this.currentPageLevel2 = 1; 
        this.currentPageLevel3 = 1;
    }

    handleSort(event) {
        const tableId = event.target.dataset.id;
        const fieldName = event.detail.fieldName;
        const sortDirection = event.detail.sortDirection;

        if (tableId === 'lvl1Table') {
            this.sortByLevel1 = fieldName;
            this.sortDirectionLevel1 = sortDirection;
            this.currentPageLevel1 = 1; 
        } else if (tableId === 'lvl2Table') {
            this.sortByLevel2 = fieldName;
            this.sortDirectionLevel2 = sortDirection;
            this.currentPageLevel2 = 1; 
        }
        else if (tableId === 'lvl3Table') {
            this.sortByLevel3 = fieldName;
            this.sortDirectionLevel3 = sortDirection;
            this.currentPageLevel3 = 1; 
        }
    }

    handleFirstPage(event) {
        const level = event.target.dataset.level;
        if (level === '1') this.currentPageLevel1 = 1;
        if (level === '2') this.currentPageLevel2 = 1;
        if (level === '3') this.currentPageLevel3 = 1;
    }

    handlePrevPage(event) {
        const level = event.target.dataset.level;
        if (level === '1' && this.currentPageLevel1 > 1) this.currentPageLevel1--;
        if (level === '2' && this.currentPageLevel2 > 1) this.currentPageLevel2--;
        if (level === '3' && this.currentPageLevel3 > 1) this.currentPageLevel3--;
    }

    handleNextPage(event) {
        const level = event.target.dataset.level;
        if (level === '1' && this.currentPageLevel1 < this.totalPagesLevel1) this.currentPageLevel1++;
        if (level === '2' && this.currentPageLevel2 < this.totalPagesLevel2) this.currentPageLevel2++;
        if (level === '3' && this.currentPageLevel3 < this.totalPagesLevel3) this.currentPageLevel3++;
    }

    handleLastPage(event) {
        const level = event.target.dataset.level;
        if (level === '1') this.currentPageLevel1 = this.totalPagesLevel1;
        if (level === '2') this.currentPageLevel2 = this.totalPagesLevel2;
        if (level === '3') this.currentPageLevel3 = this.totalPagesLevel3;
    }

    handleRowSelectionLevel1(event) {
        this.selectedLevel1Ids = event.detail.selectedRows.map(r => r.Id);
    }

    handleRowSelectionLevel2(event) {
        this.selectedLevel2Ids = event.detail.selectedRows.map(r => r.Id);
    }

    handleRowSelectionLevel3(event) {
        this.selectedLevel3Ids = event.detail.selectedRows.map(r => r.Id);
    }

    handleUpdateLevels() {
        const ids = [...this.selectedLevel1Ids, ...this.selectedLevel2Ids, ...this.selectedLevel3Ids];
        if (!ids.length) {
            this._showToast('Atención', 'Seleccioná al menos una cuenta para actualizar.', 'warning');
            return;
        }
        this.isModalOpen = true;
    }

    handleCancelUpdate() {
        this.isModalOpen = false;
    }

    async handleExecuteUpdate() {
        this.isModalOpen = false;
        const ids = [...this.selectedLevel1Ids, ...this.selectedLevel2Ids, ...this.selectedLevel3Ids];
        if (!ids.length) return; 

        this.isLoading = true;
        try {
            await updateAccountLevels({ accountIds: ids });
            this._showToast('Éxito', 'Se actualizó el nivel de las cuentas seleccionadas.', 'success'); 
            
            await Promise.all([
                refreshApex(this.wiredLevel1Result),
                refreshApex(this.wiredLevel2Result),
                refreshApex(this.wiredLevel3Result),
                refreshApex(this.wiredCountLevel1), 
                refreshApex(this.wiredCountLevel2),
                refreshApex(this.wiredCountLevel3)
            ]);
            
            this.selectedLevel1Ids = [];
            this.selectedLevel2Ids = [];
            this.selectedLevel3Ids = [];
            
            await Promise.resolve();
            const table1 = this.template.querySelector('[data-id="lvl1Table"]');
            const table2 = this.template.querySelector('[data-id="lvl2Table"]');
            const table3 = this.template.querySelector('[data-id="lvl3Table"]');
            if (table3) table3.selectedRows = [];
            if (table1) table1.selectedRows = [];
            if (table2) table2.selectedRows = [];
            
        } catch (err) {
            this._showToast('Errores de Actualización', this._formatError(err), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    _showToast(title, message, variant = 'info') {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    _formatError(error) {
        if (!error) return 'Unknown error';
        if (Array.isArray(error.body)) {
            return error.body.map(e => e.message).join('; ');
        } else if (error.body && error.body.message) {
            return error.body.message;
        } else if (error.message) {
            return error.message;
        }
        return JSON.stringify(error);
    }
}
