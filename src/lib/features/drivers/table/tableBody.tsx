import { Button, Checkbox, TableBody, TableCell, TableRow } from "@mui/material";
import getComparator, { Order } from "@/lib/utils/sorting";
import { DriverData } from "@/lib/interfaces/driver.interface";
import { useMemo } from "react";
import { Driver } from "@/lib/utils/db";
import Anchor from "@/lib/common/components/Link";

export default function TableBodyCustom(props: Readonly<{
    rows: Driver[];
    selected: string[];
    setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    page: number;
    rowsPerPage: number;
    order: Order;
    orderBy: keyof DriverData;
    handleDeleteDriver: (id: string) => void;
}>) {
        
    const { rows, selected, setSelected, page, rowsPerPage, order, orderBy, handleDeleteDriver } = props

    const handleClick = (_: React.MouseEvent<unknown>, id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];
    
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

      const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = useMemo(
    () =>
      rows
    .toSorted(getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rows, rowsPerPage],
  );
    
    return (
        
        <TableBody>
        {visibleRows.map((row, index) => {
          const isItemSelected = isSelected(row.id);
          const labelId = `Driver-table-checkbox-${index}`;

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
              <TableCell align="center">{row.rg}</TableCell>
              <TableCell align="center">{row.phone}</TableCell>
              <TableCell>
                <Button variant="contained" color="warning">
                  <Anchor href={`/motoristas/${row.id}`}>editar</Anchor>
                </Button>
              </TableCell>
              <TableCell>
                <Button variant="contained" color="error" onClick={() => handleDeleteDriver(row.id)} >
                  Excluir
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
    )
}