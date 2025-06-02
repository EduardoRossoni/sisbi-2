import { useState } from 'react'

interface Estabelecimento {
  idEstabSisbi: number
  nome: string
  sgUf: string
  nmMunicipio: string
  csSituacaoEstabelecimento: string
  pessoa: {
    pessoaJuridica: {
      nrCnpj: string
    }
  }
  capacidades: {
    bovino: number
    bovinoHora: number
    suino: number
    caprino: number
    ovino: number
    bubalino: number
    outras: number
  }
}

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = async (filteredData: Estabelecimento[], searchTerm: string = '', apenasBovinos: boolean = false) => {
    setIsExporting(true)
    
    try {
      // Preparar dados para exportação usando os dados já disponíveis
      const dadosParaExportar = filteredData.map((item) => {
        const formatCnpj = (cnpj: string) => {
          if (!cnpj || cnpj === 'N/A') return cnpj
          return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
        }

        const getSituacaoTexto = (situacao: string) => {
          switch (situacao) {
            case 'A': return 'Ativo'
            case 'P': return 'Pendente'
            default: return situacao
          }
        }

        const baseData = {
          'Nome': item.nome || 'N/A',
          'CNPJ': formatCnpj(item.pessoa?.pessoaJuridica?.nrCnpj || 'N/A'),
          'UF': item.sgUf || 'N/A',
          'Município': item.nmMunicipio || 'N/A',
          'Situação': getSituacaoTexto(item.csSituacaoEstabelecimento || 'N/A'),
          'Bovinos (abate/dia)': item.capacidades?.bovino || 0,
          'Bovinos (abate/hora)': item.capacidades?.bovinoHora || 0,
        }

        if (!apenasBovinos) {
          return {
            ...baseData,
            'Suínos (abate/dia)': item.capacidades?.suino || 0,
            'Caprinos (abate/dia)': item.capacidades?.caprino || 0,
            'Ovinos (abate/dia)': item.capacidades?.ovino || 0,
            'Bubalinos (abate/dia)': item.capacidades?.bubalino || 0,
            'Outras (abate/dia)': item.capacidades?.outras || 0,
          }
        }

        return baseData
      })

      // Criar e baixar arquivo Excel
      await downloadExcel(dadosParaExportar, searchTerm, apenasBovinos)
      
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadExcel = async (data: any[], searchTerm: string, apenasBovinos: boolean) => {
    try {
      // Importar a biblioteca XLSX dinamicamente
      const XLSX = await import('xlsx')
      
      if (data.length === 0) {
        alert('Nenhum dado para exportar')
        return
      }

      // Criar um novo workbook
      const wb = XLSX.utils.book_new()

      // Converter dados para worksheet
      const ws = XLSX.utils.json_to_sheet(data)

      // Configurar larguras das colunas
      const colWidths = [
        { wch: 50 }, // Nome
        { wch: 18 }, // CNPJ
        { wch: 8 },  // UF
        { wch: 25 }, // Município
        { wch: 12 }, // Situação
        { wch: 18 }, // Bovinos (abate/dia)
        { wch: 20 }, // Bovinos (abate/hora)
      ]

      if (!apenasBovinos) {
        colWidths.push(
          { wch: 16 }, // Suínos
          { wch: 18 }, // Caprinos
          { wch: 16 }, // Ovinos
          { wch: 18 }, // Bubalinos
          { wch: 16 }  // Outras
        )
      }

      ws['!cols'] = colWidths

      // Aplicar formatação aos headers
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue
        
        // Aplicar estilo aos headers (negrito)
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E3F2FD" } },
          alignment: { horizontal: "center" }
        }
      }

      // Adicionar worksheet ao workbook
      const sheetName = apenasBovinos ? 'Estabelecimentos_Bovinos' : 'Estabelecimentos'
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      // Gerar nome do arquivo
      const dataAtual = new Date().toISOString().slice(0, 10)
      const filtroTexto = searchTerm ? '_filtrado' : ''
      const tipoTexto = apenasBovinos ? '_bovinos' : ''
      const fileName = `estabelecimentos_sisbi${tipoTexto}${filtroTexto}_${dataAtual}.xlsx`

      // Gerar e baixar o arquivo
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Erro ao criar arquivo Excel:', error)
      
      // Fallback para CSV em caso de erro
      console.log('Gerando CSV como fallback...')
      const csvContent = convertToCSV(data)
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        const fileName = `estabelecimentos_sisbi${apenasBovinos ? '_bovinos' : ''}${searchTerm ? '_filtrado' : ''}_${new Date().toISOString().slice(0, 10)}.csv`
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape aspas e vírgulas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  return { exportToExcel, isExporting }
}