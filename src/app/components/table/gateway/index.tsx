'use client';

import {
  Table,
  TableRow,
  TableCell,
  Checkbox,
  TableBody,
  Box,
  Paper,
  TableContainer,
  TablePagination,
} from '@mui/material';
import React, { useState, useMemo, useEffect } from 'react';
import { GatehouseData } from '../../../../interfaces/gateway.interface';
import GatewayTableHead from './tableHead';
import GatewayTableToolbar from '../gatewayForm/tableToolbar';
import getComparator, { Order } from '../sorting';
import { initDB, getStoreData, Gateway, Stores } from '@/utils/db';

function createData(
    id: string,
    name: string,
    car: string,
    plate: string,
    date: string,
    hour: string,
    type: string,
  ): GatehouseData {
    return {
      id,
      name,
      car,
      plate,
      date,
      hour,
      type,
    };
  }
  
  const rows = [
    createData(
      'id-1',
      'Alexandrez',
      'ford',
      'por7787',
      "04/11/2023",
      "12:30",
      'Entrada',
    ),
    createData(
      'id-2',
      'lucas',
      'Volkswagen',
      'jds9329',
      "04/11/2023",
      "13:30",
      'Entrada',
    )
  ];

export default function GatewayTable() {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof GatehouseData>('name');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isDBReady, setIsDBReady] = useState<boolean>(false);
  const [gateways, setGateways] = useState<Gateway[]|[]>([]);

  const handleInitDB = async () => {
    const status = await initDB();
    setIsDBReady(!!status);
  };
  
  const handleGetGateways = async () => {
    if (!isDBReady) {
      await handleInitDB();
    }
    const gateways = await getStoreData<Gateway>(Stores.Gateways);
    setGateways(gateways);
  };

  useEffect(() => {
    handleGetGateways();
  }, [])


  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof GatehouseData,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = useMemo(
    () =>
      rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .sort(getComparator(order, orderBy)),
    [order, orderBy, page, rowsPerPage],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <GatewayTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <caption>Tabela de cadastro de entradas e saídas</caption>
            <GatewayTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `gateway-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {row.name}
                    </TableCell>
                    <TableCell align="center">{row.car}</TableCell>
                    <TableCell align="center">{row.plate}</TableCell>
                    <TableCell align="center">{row.date}</TableCell>
                    <TableCell align="center">{row.hour}</TableCell>
                    <TableCell align="center">{row.type}</TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página"
        />
      </Paper>
    </Box>
  );
}
