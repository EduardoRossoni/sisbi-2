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
}

interface EstabelecimentosTableProps {
  data: Estabelecimento[]
}

const ITEMS_PER_PAGE = 20

export function EstabelecimentosTable({ data }: EstabelecimentosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar dados baseado na busca
  const filteredData = useMemo(() => {
    if (!searchTerm) return data

    return data.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pessoa.pessoaJuridica.nrCnpj.includes(searchTerm) ||
      item.sgUf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nmMunicipio.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data, searchTerm])

  // Calcular paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentData = filteredData.slice(startIndex, endIndex)

  // Reset página quando buscar
  const handleSearch = (term: string) => {
    setSearchTerm(term)
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

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
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
        <div className="text-sm text-gray-500">
          {filteredData.length} de {data.length} registros
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item) => (
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
                </TableRow>
              ))
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