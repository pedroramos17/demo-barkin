'use client';


import { toZonedTime, format } from "date-fns-tz";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Checkbox,
  Paper,
  Box,
  Button,
} from '@mui/material';
import FlexSearch from 'flexsearch';
import { GatehouseData } from '../../../../interfaces/gateway.interface';
import getComparator, { Order } from '@/lib/utils/sorting';
import GatewayTableToolbar from './tableToolbar';
import GatewayTableHead from './tableHead';
import { initDB, getStoreData, Driver, Gateway, Stores, Vehicle } from '@/lib/utils/db';
import dateParseBr from '@/lib/utils/date';

interface GatewayProps extends GatehouseData {
  driverId: string;
}

export default function GatewayTable({
  query,
}: Readonly<{
  query: string;
}>) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof GatehouseData>('name');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isDBReady, setIsDBReady] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Driver[]|[]>([]);
  const [gateways, setGateways] = useState<Gateway[]|[]>([]);
  const [gatewayFormData, setGatewayFormData] = useState<Gateway>({
    id: "",
    parked: false,
    driverId: "",
    vehicleId: "",
    createdAt: "",
  })

  const date = new Date("2018-09-01T16:01:36.386Z");
  const timeZone = "Europe/Berlin";
  const zonedDate = toZonedTime(date, timeZone);

  const pattern = "d.M.yyyy HH:mm:ss.SSS 'GMT' XXX (z)";
const output = format(zonedDate, pattern, { timeZone: "Europe/Berlin" })
  console.log(output)

  function mergeGatewaysWithDrivers(gateways: Gateway[], drivers: Driver[]) {
    const driversWithGateway = drivers.filter((driver) => {
      return gateways.some((gateway) => {
        return gateway.driverId === driver.id
      })
    })
    /**
     * Merges gateways with drivers and returns an array of GatehouseData objects.
     *
     * @param {Gateway[]} gateways - An array of Gateway objects.
     * @param {Driver[]} drivers - An array of Driver objects.
     * @return {GatewayProps[]} An array of GatehouseData objects.
     */
    const entriesByDrivers: GatewayProps[] = gateways.map((gateway: Gateway): GatewayProps | undefined => {
      
      const driver: Driver | undefined = driversWithGateway.find((driver: Driver) => {
        return driver.id === gateway.driverId
      })
      if (driver) {
        const vehicle: Vehicle | undefined = driver.vehicles.find((vehicle: Vehicle) => {
          return vehicle.id === gateway.vehicleId
        }) ?? {
          id: "",
          brand: "",
          model: "",
          year: 0,
          color: "",
          plate: "",
          createdAt: "",
          updatedAt: "",
        };
        return {
          id: gateway.id,
          driverId: gateway.driverId,
          name: driver.name,
          car: `${vehicle.model} ${vehicle.brand} ${vehicle.color} ${vehicle.year}`,
          plate: vehicle.plate,
          date: (gateway.createdAt as unknown as Date).toLocaleDateString('pt-BR'),
          hour: (gateway.createdAt as unknown as Date).toLocaleTimeString('pt-BR'),
          type: gateway.parked ? "Entrada" : "Saída",
        };
      }
    }).filter((entry): entry is GatewayProps => entry !== undefined);
    const driversWithoutGateway = drivers.filter((driver) => {
      return !gateways.some((gateway) => {
        return gateway.driverId === driver.id
      })
    }).map((driver) => {
      return {
        id: driver.id,
        driverId: driver.id,
        name: driver.name,
        car: `${driver.vehicles[0].brand} ${driver.vehicles[0].model} ${driver.vehicles[0].color} ${driver.vehicles[0].year}`,
        plate: driver.vehicles[0].plate,
        date: "Sem registro",
        hour: "Sem registro",
        type: "Sem Entrada/Saida",
      }
       })
      
      const gatewaysData = [...entriesByDrivers, ...driversWithoutGateway];
      
      return gatewaysData;
  }
  const gatewaysData = mergeGatewaysWithDrivers(gateways, drivers);

  function fetchFilteredDrivers(query: string, drivers: Driver[]|[]) {
    const DriverDocument = new FlexSearch.Document({
      document: {
        id: 'id',
        index: 'name',
      },
      charset: 'latin:advanced',
      tokenize: 'reverse',
      cache: true,
      preset: 'performance',
    })

    for (const driver of drivers) {
      DriverDocument.add({
        id: driver.id,
        name: driver.name,
      })
    }
      
    const results = DriverDocument.search(query, { suggest: true });

    return results;
  }
  
  const driversResponse = fetchFilteredDrivers(query, drivers);

  let driversIds: any = [];
  driversResponse.forEach((response) => {
    driversIds = response['result'];
  })

  const rows = query ? gatewaysData.filter((gatewaysData) => driversIds.includes(gatewaysData.driverId)) : gatewaysData;

  const handleInitDB = useCallback(async () => {
    const status = await initDB();
    setIsDBReady(!!status);
  }, [setIsDBReady]);

  const handleGetGateways = useCallback(async () => {
    if (!isDBReady) {
      await handleInitDB();
    }
    const gateways = await getStoreData<Gateway>(Stores.Gateways);
    const drivers = await getStoreData<Driver>(Stores.Drivers);
    setGateways(gateways);
    setDrivers(drivers);
  }, [handleInitDB, isDBReady]);	

  useEffect(() => {
    handleGetGateways();
  }, [handleGetGateways])

  const handleGatewayDriver = (driverId: string) => {
    /**
     * Pseudo code
     * 
     * Implement a logic like create a new entry and
     *  new exit to save timestamp where is so important
     *  to log and tie spent controller.
     * 
     * filter only drivers that are parked to register the exit
     * and the driver that is not parked to register the entry
     * 
     */
    let uuid = self.crypto.randomUUID();

    const driverResponse = drivers.find((driver) => driver.id === driverId) as Driver;
    
    if (driverResponse) {
      const driverId = driverResponse.id;

      const driverWithGateway = gateways.filter((gateway) => gateway.driverId === driverId);
      const lastDriverWithGateway = driverWithGateway.toReversed().at(-1);
      if (lastDriverWithGateway) {
        setGatewayFormData({
          id: uuid,
          parked: !lastDriverWithGateway.parked,
          driverId: lastDriverWithGateway.driverId,
          vehicleId: lastDriverWithGateway.vehicleId,
          createdAt: dateParseBr(new Date()),
        })
        console.log(lastDriverWithGateway);
        }
      }
    }
  const handleRequestSort = (
    _: React.MouseEvent<unknown>,
    property: keyof GatehouseData,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      console.log(newSelected);
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

  const handleChangePage = (_: unknown, newPage: number) => {
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
        .toSorted(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, order, orderBy, page, rowsPerPage],
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
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        onClick={(event) => handleClick(event, row.id)}
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
                    <TableCell>
                      <Button variant="contained" color="primary" onClick={() => handleGatewayDriver(row.id)} >
                        {row.type === 'Entrada' ? 'Registrar saída' : 'Registrar entrada'}
                      </Button>
                    </TableCell>
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