// Dados das vagas
var vagasData = [];


fetch('planilha_atualizada.json')
    .then(response => response.json()) // Converte a resposta para JSON
    .then(data => {
        vagasData = data; // Salva os dados na variável
        console.log(vagasData); // Exibe os dados JSON
        
        // Carregar dados iniciais e popular filtros após o fetch ser concluído
        loadTableData(vagasData);
        populateFilterOptions();
    })
    .catch(error => console.error('Erro ao carregar JSON:', error));


// Elementos do DOM
const tableBody = document.getElementById('tableBody');
const toggleFilterBtn = document.getElementById('toggleFilter');
const filterPanel = document.getElementById('filterPanel');
const idFilter = document.getElementById('idFilter');
const areaFilter = document.getElementById('areaFilter');
const dateFilter = document.getElementById('dateFilter');
const localFilter = document.getElementById('localFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const appliedFiltersDiv = document.getElementById('appliedFilters');

// Variáveis para controle dos filtros
let activeFilters = {};

// Função para carregar os dados na tabela
function loadTableData(data) {
tableBody.innerHTML = '';

if (data.length === 0) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="no-results">Nenhuma vaga encontrada com os filtros aplicados.</td>
        </tr>
    `;
    return;
}

sortedData = data.sort((a, b) => new Date(b.DATA.split('/').reverse().join('-')) - new Date(a.DATA.split('/').reverse().join('-')));


sortedData.forEach(item => {
    const row = document.createElement('tr');
    
    // Garantir que a data será exibida no formato correto
    const dataFormatada = item.DATA; 

    row.innerHTML = `
        <td>${item.ID}</td>
        <td>${item.AREA}</td>
        <td>${item.EMPRESA}</td>
        <td>${dataFormatada}</td>
        <td>${item.TITULO}</td>
        <td>${item.LOCAL}</td>
        <td class="link-col"><a href="${item.LINK}" target="_blank">Ver Vaga</a></td>
    `;

    tableBody.appendChild(row);
});
}


// Função para formatar a data
function formatDate(dateString) {
const dateParts = dateString.split('/');
const date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); // dd/mm/aaaa
return date.toLocaleDateString('pt-BR');
}

// Função para popular os selects de filtro
function populateFilterOptions() {
    // Obter valores únicos para cada coluna
    const areas = [...new Set(vagasData.map(item => item.AREA))];
    const locais = [...new Set(vagasData.map(item => item.LOCAL))];
    
    // Popular o select de áreas
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
    });
    
    // Popular o select de locais
    locais.forEach(local => {
        const option = document.createElement('option');
        option.value = local;
        option.textContent = local;
        localFilter.appendChild(option);
    });
}

// Função para aplicar os filtros
function applyFilters() {
const filteredData = vagasData.filter(item => {
    const formattedFilterDate = activeFilters.DATA 
        ? activeFilters.DATA.split('-').reverse().join('/')  // Converte "aaaa-mm-dd" para "dd/mm/aaaa"
        : '';

    return (!activeFilters.ID || item.ID.toString() === activeFilters.ID) && 
        (!activeFilters.AREA || item.AREA === activeFilters.AREA) &&
        (!activeFilters.DATA || item.DATA === formattedFilterDate) &&
        (!activeFilters.LOCAL || item.LOCAL === activeFilters.LOCAL);
});

loadTableData(filteredData);
updateAppliedFilters();
}

// Função para atualizar os filtros aplicados
function updateAppliedFilters() {
    appliedFiltersDiv.innerHTML = '';
    for (const key in activeFilters) {
        if (activeFilters[key]) {
            const filterTag = document.createElement('div');
            filterTag.className = 'filter-tag';
            filterTag.innerHTML = `
                ${key}: ${activeFilters[key]}
                <button onclick="removeFilter('${key}')">&times;</button>
            `;
            appliedFiltersDiv.appendChild(filterTag);
        }
    }
}

// Função para remover um filtro
function removeFilter(key) {
    delete activeFilters[key];
    applyFilters();
}

// Event listeners
toggleFilterBtn.addEventListener('click', () => {
    filterPanel.classList.toggle('active');
});

applyFilterBtn.addEventListener('click', () => {
    activeFilters.ID = idFilter.value;
    activeFilters.AREA = areaFilter.value;
    activeFilters.DATA = dateFilter.value;
    activeFilters.LOCAL = localFilter.value;
    applyFilters();
});

clearFilterBtn.addEventListener('click', () => {
    idFilter.value = '';
    areaFilter.value = '';
    dateFilter.value = '';
    localFilter.value = '';
    activeFilters = {};
    applyFilters();
});

// Carregar dados iniciais e popular filtros
loadTableData(vagasData);
populateFilterOptions();
