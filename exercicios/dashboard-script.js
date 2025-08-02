// ==========================================================================
// DASHBOARD ANALYTICS - JAVASCRIPT
// ==========================================================================

// Configuração global
const CONFIG = {
  datatable: {
    pageLength: 10,
    responsive: true,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json",
    },
  },
  animations: {
    duration: 300,
    easing: "ease-in-out",
  },
};

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
$(document).ready(function () {
  initializeDataTable();
  initializeMetricCards();
  initializeFilters();
  updateDateTime();

  console.log("Dashboard Analytics inicializado com sucesso! 🚀");
});

// ==========================================================================
// DATATABLE
// ==========================================================================
function initializeDataTable() {
  if ($.fn.DataTable.isDataTable("#dataTable")) {
    $("#dataTable").DataTable().destroy();
  }

  const table = $("#dataTable").DataTable({
    ...CONFIG.datatable,
    order: [[3, "desc"]], // Ordenar por data decrescente
    columnDefs: [
      {
        orderable: false,
        targets: [6], // Coluna de ações não ordenável
      },
      {
        targets: [4], // Coluna de valor
        render: function (data, type, row) {
          if (type === "display") {
            return `<strong>${data}</strong>`;
          }
          return data;
        },
      },
    ],
    drawCallback: function () {
      // Aplicar tooltips nos botões após cada redraw
      $("[title]").tooltip();
    },
    initComplete: function () {
      console.log("DataTable carregada com sucesso");

      // Customizar elementos de controle
      $(".dataTables_length select").addClass("form-select form-select-sm");
      $(".dataTables_filter input").addClass("form-control form-control-sm");
    },
  });

  // Event listeners para ações da tabela
  $("#dataTable tbody").on("click", ".btn-outline-primary", function () {
    const data = table.row($(this).parents("tr")).data();
    editRecord(data);
  });

  $("#dataTable tbody").on("click", ".btn-outline-secondary", function () {
    const data = table.row($(this).parents("tr")).data();
    viewRecord(data);
  });
}

// ==========================================================================
// METRIC CARDS (BUCKETS)
// ==========================================================================
function initializeMetricCards() {
  $(".metric-card").each(function (index) {
    const $card = $(this);

    // Adicionar evento de clique
    $card.on("click", function () {
      const metricTitle = $(this).find(".metric-content p").text();
      handleMetricClick(metricTitle, $card);
    });

    // Adicionar efeito de pulse ocasional
    setTimeout(() => {
      $card.addClass("pulse-animation");
      setTimeout(() => $card.removeClass("pulse-animation"), 2000);
    }, (index + 1) * 2000);
  });
}

function handleMetricClick(metricTitle, $card) {
  console.log(`Métrica clicada: ${metricTitle}`);

  // Efeito visual de clique
  $card.css("transform", "scale(0.95)");
  setTimeout(() => {
    $card.css("transform", "");
  }, 150);

  // Simular navegação ou modal
  showMetricDetails(metricTitle);
}

function showMetricDetails(metricTitle) {
  // Simular modal ou navegação para detalhes da métrica
  const modal = `
        <div class="modal fade" id="metricModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalhes: ${metricTitle}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Aqui seriam exibidos os detalhes da métrica <strong>${metricTitle}</strong>.</p>
                        <p>Gráficos, tendências, comparações, etc.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <button type="button" class="btn btn-primary">Ver Relatório Completo</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remove modal anterior se existir
  $("#metricModal").remove();

  // Adiciona e mostra novo modal
  $("body").append(modal);
  $("#metricModal").modal("show");

  // Remove modal do DOM quando fechado
  $("#metricModal").on("hidden.bs.modal", function () {
    $(this).remove();
  });
}

// ==========================================================================
// FILTROS
// ==========================================================================
function initializeFilters() {
  // Configurar datas padrão
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  $("#dateFrom").val(formatDate(firstDay));
  $("#dateTo").val(formatDate(today));

  // Event listeners para mudanças em tempo real
  $("#houseFilter").on("change", function () {
    if ($(this).val()) {
      console.log(`Filtro de house alterado para: ${$(this).val()}`);
    }
  });

  $(".form-control, .form-select")
    .on("focus", function () {
      $(this).parent().addClass("focused");
    })
    .on("blur", function () {
      $(this).parent().removeClass("focused");
    });
}

function applyFilters() {
  const filters = {
    dateFrom: $("#dateFrom").val(),
    dateTo: $("#dateTo").val(),
    house: $("#houseFilter").val(),
  };

  console.log("Filtros aplicados:", filters);

  // Validar datas
  if (filters.dateFrom && filters.dateTo) {
    const startDate = new Date(filters.dateFrom);
    const endDate = new Date(filters.dateTo);

    if (startDate > endDate) {
      showAlert("A data início deve ser anterior à data fim.", "warning");
      return;
    }
  }

  // Mostrar loading
  const $btn = $('button[onclick="applyFilters()"]');
  const originalHtml = $btn.html();

  $btn
    .html('<i class="fas fa-spinner fa-spin"></i> Aplicando...')
    .prop("disabled", true)
    .addClass("loading");

  // Simular requisição para API
  simulateApiCall(filters)
    .then((response) => {
      console.log("Dados filtrados recebidos:", response);

      // Atualizar métricas
      updateMetrics(response.metrics);

      // Atualizar tabela
      updateDataTable(response.tableData);

      // Feedback de sucesso
      showAlert("Filtros aplicados com sucesso!", "success");

      $btn
        .html('<i class="fas fa-check"></i> Aplicado!')
        .removeClass("btn-primary")
        .addClass("btn-success");

      setTimeout(() => {
        $btn
          .html(originalHtml)
          .removeClass("btn-success loading")
          .addClass("btn-primary")
          .prop("disabled", false);
      }, 2000);
    })
    .catch((error) => {
      console.error("Erro ao aplicar filtros:", error);
      showAlert("Erro ao aplicar filtros. Tente novamente.", "danger");

      $btn.html(originalHtml).removeClass("loading").prop("disabled", false);
    });
}

// ==========================================================================
// SIMULAÇÃO DE API
// ==========================================================================
function simulateApiCall(filters) {
  return new Promise((resolve, reject) => {
    // Simular delay de rede
    setTimeout(() => {
      // Simular dados baseados nos filtros
      const mockResponse = {
        metrics: generateMockMetrics(filters),
        tableData: generateMockTableData(filters),
      };

      // 95% de sucesso
      if (Math.random() > 0.05) {
        resolve(mockResponse);
      } else {
        reject(new Error("Simulação de erro de rede"));
      }
    }, 1500);
  });
}

function generateMockMetrics(filters) {
  const baseMetrics = [1247, 847000, 2854, 18.3, 45200, 4.8, 222, 94];

  return baseMetrics.map((value) => {
    // Aplicar variação baseada nos filtros
    const variation = (Math.random() - 0.5) * 0.3; // ±15%
    const newValue = Math.round(value * (1 + variation));
    return newValue;
  });
}

function generateMockTableData(filters) {
  // Simular dados filtrados
  const allData = [
    [
      "#001",
      "Harry Potter",
      "Gryffindor",
      "15/03/2024",
      "R$ 1.250,00",
      "Ativo",
    ],
    [
      "#002",
      "Hermione Granger",
      "Gryffindor",
      "14/03/2024",
      "R$ 2.100,00",
      "Concluído",
    ],
    // ... mais dados seriam adicionados aqui
  ];

  // Aplicar filtros (simulação básica)
  let filteredData = allData;

  if (filters.house) {
    filteredData = filteredData.filter((row) =>
      row[2].toLowerCase().includes(filters.house.toLowerCase())
    );
  }

  return filteredData;
}

// ==========================================================================
// ATUALIZAÇÃO DE DADOS
// ==========================================================================
function updateMetrics(newMetrics) {
  $(".metric-card").each(function (index) {
    if (newMetrics[index] !== undefined) {
      const $valueElement = $(this).find(".metric-content h3");
      const currentValue = $valueElement.text();
      const newValue = formatMetricValue(newMetrics[index], index);

      if (currentValue !== newValue) {
        // Animação de atualização
        $valueElement.fadeOut(200, function () {
          $(this).text(newValue).fadeIn(200);
        });

        // Destacar mudança
        $(this).addClass("updated");
        setTimeout(() => {
          $(this).removeClass("updated");
        }, 2000);
      }
    }
  });
}

function updateDataTable(newData) {
  if (newData && newData.length > 0) {
    const table = $("#dataTable").DataTable();
    table.clear();

    newData.forEach((row) => {
      const formattedRow = [
        row[0], // ID
        row[1], // Nome
        `<span class="badge bg-${getHouseBadgeColor(row[2])}">${row[2]}</span>`, // House
        row[3], // Data
        row[4], // Valor
        `<span class="badge bg-${getStatusBadgeColor(row[5])}">${
          row[5]
        }</span>`, // Status
        `<button class="btn btn-sm btn-outline-primary" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>`, // Ações
      ];

      table.row.add(formattedRow);
    });

    table.draw();
  }
}

// ==========================================================================
// AÇÕES DA TABELA
// ==========================================================================
function editRecord(data) {
  console.log("Editando registro:", data);
  showAlert(`Editando registro: ${data[1]}`, "info");

  // Aqui você implementaria a lógica de edição
  // Por exemplo, abrir um modal de edição
}

function viewRecord(data) {
  console.log("Visualizando registro:", data);
  showAlert(`Visualizando detalhes de: ${data[1]}`, "info");

  // Aqui você implementaria a lógica de visualização
  // Por exemplo, navegar para uma página de detalhes
}

// ==========================================================================
// UTILITÁRIOS
// ==========================================================================
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatMetricValue(value, index) {
  switch (index) {
    case 1: // Vendas
      return `R$ ${(value / 1000).toFixed(0)}K`;
    case 3: // Taxa conversão
      return `${value.toFixed(1)}%`;
    case 4: // Visualizações
      return `${(value / 1000).toFixed(1)}K`;
    case 5: // Avaliações
      return value.toFixed(1);
    case 6: // Tempo
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}m ${seconds}s`;
    case 7: // Metas
      return `${value}%`;
    default:
      return value.toLocaleString();
  }
}

function getHouseBadgeColor(house) {
  const colors = {
    Gryffindor: "danger",
    Slytherin: "success",
    Ravenclaw: "info",
    Hufflepuff: "warning",
  };
  return colors[house] || "secondary";
}

function getStatusBadgeColor(status) {
  const colors = {
    Ativo: "success",
    Concluído: "primary",
    Pendente: "warning",
    Inativo: "secondary",
  };
  return colors[status] || "secondary";
}

function showAlert(message, type = "info") {
  const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" 
             role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

  $("body").append(alertHtml);

  // Auto-remover após 5 segundos
  setTimeout(() => {
    $(".alert").alert("close");
  }, 5000);
}

function updateDateTime() {
  const now = new Date();
  const dateTimeString = now.toLocaleString("pt-BR");

  // Se houver um elemento para mostrar data/hora
  if ($("#currentDateTime").length) {
    $("#currentDateTime").text(dateTimeString);
  }

  // Atualizar a cada minuto
  setTimeout(updateDateTime, 60000);
}

// ==========================================================================
// ANIMAÇÕES CUSTOMIZADAS
// ==========================================================================
$.fn.extend({
  animateValue: function (start, end, duration = 1000) {
    return this.each(function () {
      const $this = $(this);
      $({ value: start }).animate(
        { value: end },
        {
          duration: duration,
          easing: "swing",
          step: function () {
            $this.text(Math.floor(this.value));
          },
          complete: function () {
            $this.text(end);
          },
        }
      );
    });
  },
});

// ==========================================================================
// EVENT LISTENERS GLOBAIS
// ==========================================================================
$(window).on("resize", function () {
  // Reajustar DataTable se necessário
  if ($.fn.DataTable.isDataTable("#dataTable")) {
    $("#dataTable").DataTable().columns.adjust();
  }
});

// Keyboard shortcuts
$(document).on("keydown", function (e) {
  // Ctrl + F para focar no filtro da tabela
  if (e.ctrlKey && e.key === "f") {
    e.preventDefault();
    $(".dataTables_filter input").focus();
  }

  // F5 para atualizar filtros
  if (e.key === "F5") {
    e.preventDefault();
    applyFilters();
  }
});

// ==========================================================================
// CSS DINÂMICO PARA ANIMAÇÕES
// ==========================================================================
$("<style>")
  .prop("type", "text/css")
  .html(
    `
        .pulse-animation {
            animation: pulse 2s ease-in-out;
        }
        
        .updated {
            animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(220, 53, 69, 0.1); }
        }
        
        .focused {
            transform: scale(1.02);
            transition: transform 0.2s ease;
        }
    `
  )
  .appendTo("head");
