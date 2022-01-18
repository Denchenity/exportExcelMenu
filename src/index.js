import './style/style.scss';

import ExportExcelMenu from './exportExcelMenu';

const exportMenu = new ExportExcelMenu({
    tableSelector: 'table',
    menuParent:'#export-menu',
    btnText: 'Экспортировать'
});