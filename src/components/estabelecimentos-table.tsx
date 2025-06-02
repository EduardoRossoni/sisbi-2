'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

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

interface EstabelecimentosTableProps {
  data: Estabelecimento[]
}

const ITEMS_PER_PAGE = 20

export function EstabelecimentosTable({ data }: EstabelecimentosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroBovinosAtivo, setFiltroBovinosAtivo] = useState(false)

  // Filtrar dados baseado na busca e filtro de bovinos
  const filteredData = useMemo(() => {
    let result = data

    // Aplicar filtro de bovinos se ativo
    if (filtroBovinosAtivo) {
      result = result.filter(item => 
        item.capacidades.bovino > 0 || item.capacidades.bovinoHora > 0
      )
    }

    // Aplicar filtro de busca
    if (searchTerm) {
      result = result.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pessoa.pessoaJuridica.nrCnpj.includes(searchTerm) ||
        item.sgUf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nmMunicipio.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return result
  }, [data, searchTerm, filtroBovinosAtivo])

  // Calcular paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = filteredData.slice(startIndex, endIndex)

  // Reset página quando buscar ou filtrar
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  const toggleFiltroBovinos = () => {
    setFiltroBovinosAtivo(!filtroBovinosAtivo)
    setCurrentPage(1)
  }

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'A':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
      case 'P':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      default:
        return <Badge variant="outline">{situacao}</Badge>
    }
  }

  const formatCnpj = (cnpj: string) => {
    if (!cnpj || cnpj === 'N/A') return cnpj
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const formatCapacidade = (valor: number) => {
    if (valor === 0) return '-'
    return valor.toLocaleString('pt-BR')
  }

  const getCapacidadeTotal = (capacidades: Estabelecimento['capacidades']) => {
    return capacidades.bovino + capacidades.suino + capacidades.caprino + 
           capacidades.ovino + capacidades.bubalino + capacidades.outras
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, CNPJ, UF ou município..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={filtroBovinosAtivo ? "default" : "outline"}
          size="sm"
          onClick={toggleFiltroBovinos}
          className={filtroBovinosAtivo ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          🐄 Apenas Bovinos
        </Button>
        <div className="text-sm text-gray-500">
          {filteredData.length} de {data.length} registros
          {filtroBovinosAtivo && (
            <div className="text-xs text-amber-600 font-medium">
              Filtro bovinos ativo
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-center">Bovinos (abate/dia)</TableHead>
              <TableHead className="text-center">Bovinos (abate/hora)</TableHead>
              {!filtroBovinosAtivo && (
                <>
                  <TableHead className="text-center">Suínos (abate/dia)</TableHead>
                  <TableHead className="text-center">Caprinos (abate/dia)</TableHead>
                  <TableHead className="text-center">Ovinos (abate/dia)</TableHead>
                  <TableHead className="text-center">Bubalinos (abate/dia)</TableHead>
                  <TableHead className="text-center">Outras (abate/dia)</TableHead>
                  <TableHead className="text-center">Total Abate/dia</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filtroBovinosAtivo ? 7 : 13} className="text-center py-8 text-gray-500">
                  {filtroBovinosAtivo && !searchTerm ? 
                    'Nenhum estabelecimento com capacidade de abate de bovinos encontrado' :
                    searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'
                  }
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item) => {
                const totalCapacidade = getCapacidadeTotal(item.capacidades)
                
                return (
                  <TableRow key={item.idEstabSisbi}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={item.nome}>
                        {item.nome}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCnpj(item.pessoa.pessoaJuridica.nrCnpj)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.sgUf}</Badge>
                    </TableCell>
                    <TableCell>{item.nmMunicipio}</TableCell>
                    <TableCell>
                      {getSituacaoBadge(item.csSituacaoEstabelecimento)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatCapacidade(item.capacidades.bovino)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {formatCapacidade(item.capacidades.bovinoHora)}
                    </TableCell>
                    {!filtroBovinosAtivo && (
                      <>
                        <TableCell className="text-center font-mono text-sm">
                          {formatCapacidade(item.capacidades.suino)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {formatCapacidade(item.capacidades.caprino)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {formatCapacidade(item.capacidades.ovino)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {formatCapacidade(item.capacidades.bubalino)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {formatCapacidade(item.capacidades.outras)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm font-bold">
                          {totalCapacidade > 0 ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {formatCapacidade(totalCapacidade)}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Página {currentPage} de {totalPages} • 
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredData.length)} de {filteredData.length}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}