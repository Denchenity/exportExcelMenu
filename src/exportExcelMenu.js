export default class ExportExcelTableMenu {
    constructor(props){
        this.tableSelector = props.tableSelector; // css selector
        this.menuParent = props.menuParent;// css selector
        this.btnText = props.btnText;
        this.menuClass = props.menuClass;
        this.fileName = props.fileName;

        this.table = document.querySelector(props.tableSelector);

        this.menuItems = [...this.table.querySelectorAll('thead th')].map((th, i) => {
            if(i == 0){
                return `
                    <p>
                        <input type="checkbox" id="check-all-col" checked>
                        <label for="check-all-col" data-type="all-checked">Все колонки</label>
                    </p>
                    <p>
                        <input type="checkbox" id="export-checkbox-${i}" check-col="${i + 1}">
                        <label for="export-checkbox-${i}">${th.textContent}</label>
                    </p>
                `;
                
            }else {
                return `
                    <p>
                        <input type="checkbox" id="export-checkbox-${i}" check-col="${i + 1}">
                        <label for="export-checkbox-${i}">${th.textContent}</label>
                    </p>
                `; 
            }
            
        });

        //добавляем атрибуты для th
        [...this.table.querySelectorAll('thead th')].forEach((th, i) => {
            th.setAttribute(`export-col`, i+1);
        });

        this.menuParent = document.querySelector(this.menuParent);

        this.$menu = document.createElement('div');

        this.menuClass ? this.$menu.classList.add(this.menuClass) : this.$menu.classList.add('export-excel-menu');
        
        this.$menu.innerHTML = `
            <div class="export__backdrop" data-type="backdrop"></div>
            <div class="export__btn-wrap">
                <div class="export__btn-confirm" data-type="confirm">${this.btnText ?? 'Экспортировать'}</div>
                <div class="export__btn-menu" data-type="list"></div>
            </div>
            <div class="export__menu-confirm" data-type="export">
                <div class="export__icon-excel"></div>
                <div class="export__menu-confirm_text">Excel</div>
            </div>
            <div class="export__menu-list"></div>
        `;

        this.list = this.$menu.querySelector('.export__menu-list');

        this.list.innerHTML = this.menuItems.join('');

        this.menuParent.append(this.$menu);

        //Все чекбоксы
        this.allCheckbox = this.list.querySelectorAll('input[type="checkbox"]');

        //input всех колонок
        this.checkAllcolInput = this.$menu.querySelector('#check-all-col');

        this.#setup();

    }

    #setup(){
        this.clickHandler = this.clickHandler.bind(this);
        this.$menu.addEventListener('click', this.clickHandler);
    }

    clickHandler(event){
        let { type } = event.target.dataset;
        if(type == 'list'){
            this.toggleMenu();
            this.toggleChecked();
            this.closeConfirm();
        }else if(type == 'confirm'){
            this.toggleConfirm();
            this.closeMenu();
        }else if(type == 'backdrop'){
            this.closeMenu();
            this.closeConfirm();
        }else if(type == 'export'){
            this.downloadFile();
        }else if(type == "all-checked"){
            this.toggleChecked();
        }
    }

    openMenu(){
        this.$menu.classList.add('open-export-menu');
    }

    openConfirm(){
        this.$menu.classList.add('open-export-menu-confirm');
    }

    closeMenu(){
        this.$menu.classList.remove('open-export-menu');
    }

    closeConfirm(){
        this.$menu.classList.remove('open-export-menu-confirm');
    }

    toggleMenu(){
        this.IsOpenMenu ? this.closeMenu() : this.openMenu();
    }

    toggleConfirm(){
        this.isOpenConfirm ? this.closeConfirm() : this.openConfirm();
    }

    get IsOpenMenu(){
        return this.$menu.classList.contains('open-export-menu');
    }

    get isOpenConfirm(){
        return this.$menu.classList.contains('open-export-menu-confirm');
    }

    downloadFile(){

        //Получем атрибуты (номера колонок) с отмеченных чекбоксов
        let indexNthChild = [...this.allCheckbox].map(input => {
            if(input.checked === true){
                let childCount = input.getAttribute('check-col');
                return childCount;
            }
            return false;
        });

        //копируем таблицу чтобы редактировать ее под выгрузку
        let cloneTable = this.table.cloneNode(true)

        //отмечаем в скопированной таблице нужные ячейки атрибутом run-export-excel
        let cloneThead = cloneTable.querySelector('thead');
        let cloneTbody = cloneTable.querySelector('tbody');
        let cloneTfoot = cloneTable.querySelector('tfoot');
        indexNthChild.forEach(nthChild => {
            if(nthChild){
                checkExportCell(cloneThead,'th',nthChild);
                checkExportCell(cloneTbody,'td',nthChild);
                checkExportCell(cloneTfoot,'td',nthChild);
            }
        });

        function checkExportCell(parent,cell,index){
            if(parent){
                parent.querySelectorAll(`${cell}:nth-child(${index})`).forEach(cell => {
                    cell.setAttribute('run-export-excel', '');
                });
            }
        }

        //удаляем ячейки без атрибута run-export-excel
        deleteUncheckedCellInCloneTable(cloneThead, 'run-export-excel', 'th');
        deleteUncheckedCellInCloneTable(cloneTbody, 'run-export-excel', 'td');
        deleteUncheckedCellInCloneTable(cloneTfoot, 'run-export-excel', 'td');

        function deleteUncheckedCellInCloneTable(parent, attr, cell){
            if(parent){
                parent.querySelectorAll(cell).forEach(cell => {
                    if(!cell.hasAttribute(attr)){
                        cell.parentElement.removeChild(cell);
                    }
                });
            }
        }

        //если в таблице есть tfoor то в первую ячейку tfoot добавляем Итог
        if(cloneTfoot){
            if(cloneTfoot.querySelector('td')){
                cloneTfoot.querySelector('td').textContent = 'Итого';
            }
            
        }

       //Получаем время сегодня
       let nowDate = new Date().toLocaleDateString();
       let newExportDate = nowDate.replaceAll('.', '-')
       
        const tableToExcel = (function() {
            const uri = 'data:application/vnd.ms-excel;base64,';
            const  template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>';
            const base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) };
            const format = function(s, c) { 	    	 
                return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) 
            };
            const downloadURI = function(uri, name) {
                var link = document.createElement("a");
                link.download = name;
                link.href = uri;
                link.click();
            }
    
            return function(table, name, fileName) {
                if (!table.nodeType) table = document.getElementById(table)
                    let ctx = {worksheet: name || 'Worksheet', table: table.innerHTML}
                    let resuri = uri + base64(format(template, ctx));
                    downloadURI(resuri, fileName);
            }
        })(); 
        tableToExcel(cloneTable, '', `${this.filename ?? 'export-table'} ${newExportDate}`);
    }

    toggleChecked(){
        setTimeout(()=> {
            this.isCheckedAll ? this.chekedAll() : this.unchekedAll();
        },0);
    }

    get isCheckedAll(){
        return this.checkAllcolInput.checked;
    }

    chekedAll(){
        this.allCheckbox.forEach(box => box.checked = true);
    }

    unchekedAll(){
        this.allCheckbox.forEach(box => box.checked = false);
    }

    destroy(){
        this.parent.innerHTML = '';
        this.$menu.removeEventListener('click', this.clickHandler);
    }
}