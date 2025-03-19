// Dados das vagas
var vagasData = [];

fetch('planilha_atualizada.json')
    .then(response => response.json())
    .then(data => {
        vagasData = data;
        console.log('Total de vagas:', vagasData.length);
        console.log('Vagas de Analista:', vagasData.filter(item => 
            item.TITULO.toLowerCase().includes('analista')).length);
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

    currentData = data.sort((a, b) => new Date(b.DATA.split('/').reverse().join('-')) - new Date(a.DATA.split('/').reverse().join('-')));
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
    
    // Debug
    console.log('Total de vagas filtradas:', currentData.length);
    console.log('Vagas exibidas:', displayData.length);
    console.log('Página atual:', currentPage);
    console.log('Deve mostrar botão carregar mais:', hasMoreCards);
    console.log('Índice final:', endIndex);

    // Força a exibição do botão se houver mais cards
    loadMoreContainer.style.display = hasMoreCards ? 'flex' : 'none';
    document.getElementById('totalVagas').textContent = `Mostrando ${displayData.length} de ${currentData.length} vagas`;
}

// Função para criar e adicionar um card
function createAndAppendCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-empresa">${item.EMPRESA}</span>
            <div class="card-data-container">
                <span class="card-data-label">Publicado em</span>
                <span class="card-data">${item.DATA}</span>
            </div>
        </div>
        <div class="card-titulo">${item.TITULO}</div>
        <div class="card-footer">
            <div class="card-tags">
                <span class="tag" data-type="area">${item.AREA}</span>
                <span class="tag" data-type="${item.LOCAL === 'REMOTO' ? 'local-remoto' : 'local-outros'}">${item.LOCAL}</span>
            </div>
            <a href="${item.LINK}" target="_blank" class="card-link">
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
    const areas = [...new Set(vagasData.map(item => item.AREA))];
    const locais = [...new Set(vagasData.map(item => item.LOCAL))];
    
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

// Função para converter data do formato dd/mm/aaaa para objeto Date
function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

// Função para realizar a busca por título
function performTitleSearch() {
    toggleLoading(true);
    
    setTimeout(() => {
        const searchTerm = titleFilter.value.trim();
        
        if (searchTerm === '') {
            delete activeFilters.TITULO;
        } else {
            activeFilters.TITULO = searchTerm;
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
    const itemDate = parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
        case '7':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return itemDate >= sevenDaysAgo;
        
        case '30':
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            return itemDate >= thirtyDaysAgo;
        
        case 'thisMonth':
            const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return itemDate >= firstDayThisMonth && itemDate <= lastDayThisMonth;
        
        case 'lastMonth':
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return itemDate >= firstDayLastMonth && itemDate <= lastDayLastMonth;
        
        default:
            return true;
    }
}

// Função para aplicar os filtros
function applyFilters() {
    const filteredData = vagasData.filter(item => {
        const titleMatch = !activeFilters.TITULO || 
            item.TITULO.toLowerCase().includes(activeFilters.TITULO.toLowerCase());
        
        const areaMatch = !activeFilters.AREA || 
            item.AREA === activeFilters.AREA;
        
        const localMatch = !activeFilters.LOCAL || 
            item.LOCAL === activeFilters.LOCAL;
        
        const periodMatch = !activeFilters.PERIODO || 
            isDateInPeriod(item.DATA, activeFilters.PERIODO);

        return titleMatch && areaMatch && localMatch && periodMatch;
    });

    // Debug
    console.log('Filtros ativos:', activeFilters);
    console.log('Quantidade de vagas após filtro:', filteredData.length);

    updateAppliedFilters();
    loadCards(filteredData);
    return filteredData;
}

// Função para atualizar os filtros aplicados
function updateAppliedFilters() {
    appliedFiltersDiv.innerHTML = '';
    
    // Conta quantos filtros estão ativos
    let activeFiltersCount = Object.keys(activeFilters).length;
    
    if (activeFilters.TITULO) {
        addFilterTag('Título', activeFilters.TITULO);
    }
    if (activeFilters.AREA) {
        addFilterTag('Área', activeFilters.AREA);
    }
    if (activeFilters.LOCAL) {
        addFilterTag('Local', activeFilters.LOCAL);
    }
    if (activeFilters.PERIODO) {
        const periodoTexto = {
            '7': 'Últimos 7 dias',
            '30': 'Últimos 30 dias',
            'thisMonth': 'Este mês',
            'lastMonth': 'Mês anterior'
        }[activeFilters.PERIODO];
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
            delete activeFilters.TITULO;
            break;
        case 'Área':
            areaFilter.value = '';
            delete activeFilters.AREA;
            break;
        case 'Local':
            localFilter.value = '';
            delete activeFilters.LOCAL;
            break;
        case 'Período':
            periodFilter.value = '';
            delete activeFilters.PERIODO;
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
        delete activeFilters.AREA;
    } else {
        activeFilters.AREA = areaFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

localFilter.addEventListener('change', () => {
    if (localFilter.value === '') {
        delete activeFilters.LOCAL;
    } else {
        activeFilters.LOCAL = localFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

periodFilter.addEventListener('change', () => {
    if (periodFilter.value === '') {
        delete activeFilters.PERIODO;
    } else {
        activeFilters.PERIODO = periodFilter.value;
    }
    currentPage = 1;
    applyFilters();
});

// Carregar dados iniciais e popular filtros
loadCards(vagasData);
populateFilterOptions();
