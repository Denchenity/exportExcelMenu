export default class ExportExcelTableMenu {
    constructor(props){
        this.tableSelector = props.tableSelector; // css selector
        this.menuParent = props.menuParent;// css selector
        this.btnText = props.btnText;
        this.menuClass = props.menuClass;
        this.fileName = props.fileName;

        this.table = document.querySelector(this.tableSelector);

        this.menuItems = [...this.table.querySelectorAll('thead th')].map(th => th.textContent);

        //добавляем атрибуты для th
        [...this.table.querySelectorAll('thead th')].forEach((th, i) => {
            th.setAttribute(`export-col`, i+1);
        });

        this.menuParent = document.querySelector(this.menuParent);

        this.$menu = document.createElement('div');

        this.menuClass ? this.$menu.classList.add(this.menuClass) : this.$menu.classList.add('export-excel-menu');
        
        this.$menu.innerHTML = `
            <div class="export__btn-wrap">
                <div class="export__btn-confirm" data-open-menu-confirm>${this.btnText}</div>
                <div class="export__btn-menu" data-open-menu-list></div>
            </div>
            <div class="export__menu-confirm" data-export-confirm>
                <div class="export__icon-excel" data-export-confirm></div>
                <div class="export__menu-confirm_text" data-export-confirm>Excel</div>
            </div>
            <div class="export__menu-list"></div>
        `;

        this.list = this.$menu.querySelector('.export__menu-list');

        this.menuItems.forEach((itemText, i) => {
            let checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('id', `export-checkbox-${i}`);

            let itemWrap = document.createElement('p');

            let label = document.createElement('label');
            label.setAttribute('for', `export-checkbox-${i}`);
            label.textContent = itemText;

            let controlElem = [checkbox, label]
            itemWrap.append(...controlElem);
            

            this.list.append(itemWrap);

        });

        this.menuParent.append(this.$menu);

        //Все чекбоксы
        this.allCheckbox = this.list.querySelectorAll('input[type="checkbox"]');

        //добавляем атрибуты для чекбоксов
        this.allCheckbox.forEach((check,i) => {
            check.setAttribute('check-col', i+1);
        });

        //выбор всех файлов (Пункт выбора всех чекбоксов)
        const enterAllCol = createCheckAllCol();
        this.list.prepend(enterAllCol);

        this.$btnList = this.$menu.querySelector('[data-open-menu-list]');

        document.addEventListener('click', event => {

            //узнаем количество строк в таблице
            let contRow = this.table.querySelectorAll('tbody tr').length;

            if(event.target.hasAttribute('data-open-menu-list') || event.target.closest('.export__menu-list')){
                this.$menu.classList.toggle('open-export-menu');
                this.$menu.classList.remove('open-export-menu-confirm');
            }else if(event.target.hasAttribute('data-open-menu-confirm')){
                this.$menu.classList.toggle('open-export-menu-confirm');
                this.$menu.classList.remove('open-export-menu');

            }else if(event.target.hasAttribute('data-export-confirm')){

                setTimeout(()=>{
                    this.$menu.classList.remove('open-export-menu-confirm');
                   }, 500);
                //проверка на пустоту таблицы
                if(contRow > 1){
                    downloadFile(this.table, this.$menu, this.fileName);
                }
                else {
                    alert('Ошибка');
                }
            }else {
                this.$menu.classList.remove('open-export-menu-confirm');
                this.$menu.classList.remove('open-export-menu');
            }
        });

        //input всех колонок
        this.checkAllcolInput = this.$menu.querySelector('#check-all-col');

        this.checkAllcolInput.addEventListener('change', event => {
            if(this.checkAllcolInput.checked === true){
                checkedAllinput([...this.allCheckbox]);
            }else {
                uncheckedAllInput([...this.allCheckbox]);
            }
        });

        if(this.checkAllcolInput.checked === true){
            checkedAllinput([...this.allCheckbox])
        }

        //чекбокс выбора всех файлов
        function createCheckAllCol(){
            let wrap = document.createElement('p')

            let check = document.createElement('input');
            check.setAttribute('type', 'checkbox');
            check.setAttribute('id', 'check-all-col');
            check.checked = true;

            let label = document.createElement('label');
            label.setAttribute('for', 'check-all-col')
            label.textContent = 'Все файлы';

            let controls = [check, label]
            wrap.append(...controls);

            return wrap;
        }

        function checkedAllinput(inputs){
            inputs.forEach(checkbox => {
                if(!checkbox.classList.contains('check-all-col')){
                    checkbox.checked = true;
                }
            })
        }

        function uncheckedAllInput(inputs){
            inputs.forEach(checkbox => {
                checkbox.checked = false;
            })
        }

        function downloadFile(table, menu, filename){
            // console.log('Загрзука файлов');

            let allCheckbox = menu.querySelectorAll('input[id*="export-checkbox-"]');

            //Получем атрибуты (номера колонок) с отмеченных чекбоксов
            let indexNthChild = [...allCheckbox].map(input => {
                if(input.checked === true){
                    let childCount = input.getAttribute('check-col');
                    return childCount;
                }
                return false;
            });

            //копируем таблицу чтобы редактировать ее под выгрузку
            let cloneTable = table.cloneNode(true)

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
                        let resuri = uri + base64(format(template, ctx))
                    downloadURI(resuri, fileName);
                }
            })(); 

            tableToExcel(cloneTable, '', `${filename} ${newExportDate}`);
            
        }

    }
}