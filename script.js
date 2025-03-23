// Dados das vagas
var vagasData = [];

fetch('planilha_atualizada.json')
    .then(response => response.json())
    .then(data => {
        vagasData = Object.values(data).flat();
        loadCards(vagasData);
        populateFilterOptions();
    })
    .catch(error => console.error('Erro ao carregar JSON:', error));

// Elementos do DOM
const cardsContainer = document.getElementById('cardsContainer');
const filterPanel = document.getElementById('filterPanel');
const titleFilter = document.getElementById('titleFilter');
const areaFilter = document.getElementById('areaFilter');
const localFilter = document.getElementById('localFilter');
const periodFilter = document.getElementById('periodFilter');
const applyFilterBtn = document.getElementById('applyFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const appliedFiltersDiv = document.getElementById('appliedFilters');
const loadingIndicator = document.getElementById('loadingIndicator');
const searchButton = document.getElementById('searchButton');

// Variáveis para controle dos filtros
let activeFilters = {};
let currentPage = 1;
const cardsPerPage = 9;
let currentData = [];

// Função para mostrar/esconder o loading
function toggleLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
    cardsContainer.style.display = show ? 'none' : 'grid';
}

// Função para carregar os cards
function loadCards(data) {
    // Ordena os dados por data mais recente e atualiza currentData
    if (!Array.isArray(data)) {
        console.error('Data não é um array:', data);
        return;
    }

    currentData = data.sort((a, b) => new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-')));
    cardsContainer.innerHTML = '';

    if (currentData.length === 0) {
        cardsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhuma vaga encontrada com os filtros aplicados.</p>
            </div>
        `;
        document.getElementById('loadMoreContainer').style.display = 'none';
        return;
    }

    // Calcula o índice final baseado na página atual
    const endIndex = currentPage * cardsPerPage;
    const displayData = currentData.slice(0, endIndex);

    // Cria e adiciona os cards
    displayData.forEach(item => createAndAppendCard(item));

    // Atualiza a exibição do botão "Carregar Mais" e contador
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const hasMoreCards = currentData.length > endIndex;
    

    // Força a exibição do botão se houver mais cards
    loadMoreContainer.style.display = hasMoreCards ? 'flex' : 'none';
    document.getElementById('totalVagas').textContent = `Mostrando ${displayData.length} de ${currentData.length} vagas`;
}

// Função para formatar a data no formato dd/mm/aaaa
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses são 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}


// Função para criar e adicionar um card
function createAndAppendCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-empresa">${item.empresa}</span>
            <div class="card-data-container">
                <span class="card-data-label">Publicado em</span>
                <span class="card-data">${formatDate(new Date(item.data))}</span>
            </div>
        </div>
        <div class="card-titulo">${item.titulo}</div>
        <div class="card-footer">
            <div class="card-tags">
                <span class="tag" data-type="area">${item.area}</span>
                <span class="tag" data-type="${item.local === 'REMOTO' ? 'local-remoto' : 'local-outros'}">${item.local}</span>
            </div>
            <a href="${item.link}" target="_blank" class="card-link">
                <i class="fas fa-external-link-alt"></i>
                Ver Vaga
            </a>
        </div>
    `;

    cardsContainer.appendChild(card);
}

// Função para atualizar a visibilidade do botão "Carregar Mais"
function updateLoadMoreVisibility(displayedCount, totalCount) {
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const hasMoreCards = displayedCount < totalCount;
    
    loadMoreContainer.style.display = hasMoreCards ? 'flex' : 'none';
    
    const totalVagasText = hasMoreCards
        ? `Mostrando ${displayedCount} de ${totalCount} vagas`
        : `Mostrando todas as ${totalCount} vagas`;
    
    document.getElementById('totalVagas').textContent = totalVagasText;
}

// Função para carregar mais cards
function loadMore() {
    currentPage++;
    console.log('Carregando mais... Página:', currentPage);
    loadCards(currentData);
}

// Função para popular os selects de filtro
function populateFilterOptions() {
    const areas = [...new Set(vagasData.map(item => item.area))].sort();
    const locais = [...new Set(vagasData.map(item => item.local))].sort();
    
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaFilter.appendChild(option);
    });
    
    locais.forEach(local => {
        const option = document.createElement('option');
        option.value = local;
        option.textContent = local;
        localFilter.appendChild(option);
    });
}

// Função para converter a data no formato dd/mm/yyyy para yyyy-mm-dd (ISO)
function convertToISODate(dateStr) {
    const [day, month, year] = dateStr.split('/'); // Supondo que a data já esteja no formato dd/mm/yyyy
    return `${year}-${month}-${day}`; // Retorna no formato yyyy-mm-dd
}

// Função para analisar e formatar a data
function parseDate(dateStr) {
    return new Date(convertToISODate(dateStr)); // Converte a data no formato dd/mm/yyyy para um objeto Date
}

// Função para realizar a busca por título
function performTitleSearch() {
    toggleLoading(true);
    
    setTimeout(() => {
        const searchTerm = titleFilter.value.trim();
        
        if (searchTerm === '') {
            delete activeFilters.titulo;
        } else {
            activeFilters.titulo = searchTerm;
        }
        
        currentPage = 1;
        const filteredData = applyFilters();
        
        // Garante que o botão "Carregar Mais" seja exibido se necessário
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const hasMoreCards = filteredData.length > cardsPerPage;
        loadMoreContainer.style.display = hasMoreCards ? 'flex' : 'none';
        
        toggleLoading(false);
        
        // Limpa o campo de busca após a pesquisa
        titleFilter.value = '';
    }, 2000);
}

// Função para verificar se uma data está dentro do período selecionado
function isDateInPeriod(dateStr, period) {
    const itemDate = parseDate(dateStr); // Converte a string da data para o formato ISO
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignora horas, minutos, segundos e milissegundos

    // Função para calcular a data X dias atrás
    function getDateNDaysAgo(n) {
        const date = new Date(today);
        date.setDate(today.getDate() - n);
        return formatDate(date); // Retorna a data no formato dd/mm/yyyy
    }

    // Função para calcular o primeiro e o último dia do mês atual ou anterior
    function getMonthStartEnd(monthOffset) {
        const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
        return { firstDay: formatDate(firstDay), lastDay: formatDate(lastDay) }; // Formata as datas para dd/mm/yyyy
    }

    // Verificar o período selecionado
    switch (period) {
        case '24': // Últimas 24 horas
            return itemDate >= parseDate(getDateNDaysAgo(1));

        case '7': // Últimos 7 dias
            return itemDate >= parseDate(getDateNDaysAgo(7));

        case '30': // Últimos 30 dias
            return itemDate >= parseDate(getDateNDaysAgo(30));

        case 'thisMonth': // Mês atual
            const { firstDay: firstDayThisMonth, lastDay: lastDayThisMonth } = getMonthStartEnd(0);
            return itemDate >= parseDate(firstDayThisMonth) && itemDate <= parseDate(lastDayThisMonth);

        case 'lastMonth': // Mês anterior
            const { firstDay: firstDayLastMonth, lastDay: lastDayLastMonth } = getMonthStartEnd(-1);
            return itemDate >= parseDate(firstDayLastMonth) && itemDate <= parseDate(lastDayLastMonth);

        default:
            return true;
    }
}

// Função para aplicar os filtros
function applyFilters() {
    const filteredData = vagasData.filter(item => {
        const titleMatch = !activeFilters.titulo || 
            item.titulo.toLowerCase().includes(activeFilters.titulo.toLowerCase());
        
        const areaMatch = !activeFilters.area || 
            item.area === activeFilters.area;
        
        const localMatch = !activeFilters.local || 
            item.local === activeFilters.local;
        
        const periodMatch = !activeFilters.periodo || 
            isDateInPeriod(item.data, activeFilters.periodo);

        return titleMatch && areaMatch && localMatch && periodMatch;
    });


    updateAppliedFilters();
    loadCards(filteredData);
    return filteredData;
}

// Função para atualizar os filtros aplicados
function updateAppliedFilters() {
    appliedFiltersDiv.innerHTML = '';
    
    // Conta quantos filtros estão ativos
    let activeFiltersCount = Object.keys(activeFilters).length;
    
    if (activeFilters.titulo) {
        addFilterTag('Título', activeFilters.titulo);
    }
    if (activeFilters.area) {
        addFilterTag('Área', activeFilters.area);
    }
    if (activeFilters.local) {
        addFilterTag('Local', activeFilters.local);
    }
    if (activeFilters.periodo) {
        const periodoTexto = {
            '24': 'Últimas 24 horas',
            '7': 'Últimos 7 dias',
            '30': 'Últimos 30 dias',
            'thisMonth': 'Este mês',
            'lastMonth': 'Mês anterior'
        }[activeFilters.periodo];
        if (periodoTexto) {
            addFilterTag('Período', periodoTexto);
        }
    }

    // Adiciona o botão de limpar todos se houver filtros ativos
    if (activeFiltersCount > 0) {
        const clearAllButton = document.createElement('button');
        clearAllButton.className = 'clear-all-filters';
        clearAllButton.innerHTML = `
            <i class="fas fa-times-circle"></i>
            Limpar todos os filtros
        `;
        clearAllButton.onclick = clearAllFilters;
        appliedFiltersDiv.appendChild(clearAllButton);
    }
}

// Função para adicionar tag de filtro
function addFilterTag(key, value) {
    const filterTag = document.createElement('div');
    filterTag.className = 'filter-tag';
    filterTag.innerHTML = `
        ${key}: ${value}
        <button onclick="removeFilter('${key}')">&times;</button>
    `;
    appliedFiltersDiv.appendChild(filterTag);
}

// Função para remover um filtro
function removeFilter(key) {
    switch(key) {
        case 'Título':
            titleFilter.value = '';
            delete activeFilters.titulo;
            break;
        case 'Área':
            areaFilter.value = '';
            delete activeFilters.area;
            break;
        case 'Local':
            localFilter.value = '';
            delete activeFilters.local;
            break;
        case 'Período':
            periodFilter.value = '';
            delete activeFilters.periodo;
            break;
    }
    applyFilters();
}

// Função para limpar todos os filtros
function clearAllFilters() {
    titleFilter.value = '';
    areaFilter.value = '';
    localFilter.value = '';
    periodFilter.value = '';
    activeFilters = {};
    currentPage = 1;
    applyFilters();
}

// Event listeners
titleFilter.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Previne o comportamento padrão do Enter
        performTitleSearch();
    }
});

searchButton.addEventListener('click', performTitleSearch);

// Adiciona event listeners para os selects
areaFilter.addEventListener('change', () => {
    if (areaFilter.value === '') {
        delete activeFilters.area;
    } else {
        activeFilters.area = areaFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

localFilter.addEventListener('change', () => {
    if (localFilter.value === '') {
        delete activeFilters.local;
    } else {
        activeFilters.local = localFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

periodFilter.addEventListener('change', () => {
    if (periodFilter.value === '') {
        delete activeFilters.periodo;
    } else {
        activeFilters.periodo = periodFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

// Carregar dados iniciais e popular filtros
loadCards(vagasData);
populateFilterOptions();
