import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import type { MemberStanding } from '../../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import './StandingsTable.css';

interface StandingsTableProps {
  data: MemberStanding[];
  isWeeklyView?: boolean;
}

const columnHelper = createColumnHelper<MemberStanding>();

export const StandingsTable: React.FC<StandingsTableProps> = ({ data, isWeeklyView = true }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('rank', {
        header: '#',
        cell: (info) => {
          const rank = info.getValue();
          if (rank === 1) return <span className="standings-table__medal standings-table__medal--gold">🥇 1</span>;
          if (rank === 2) return <span className="standings-table__medal standings-table__medal--silver">🥈 2</span>;
          if (rank === 3) return <span className="standings-table__medal standings-table__medal--bronze">🥉 3</span>;
          return <span className="standings-table__rank-number">{rank}</span>;
        },
      }),
      columnHelper.accessor('alias', {
        header: 'Participante',
        cell: (info) => {
          const member = info.row.original;
          return (
            <div className="standings-table__member">
              <div className="standings-table__avatar">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.alias} />
                ) : (
                  <span>{member.alias.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="standings-table__name-col">
                <span className="standings-table__alias">{member.alias}</span>
                {member.displayName && member.displayName !== member.alias && (
                  <span className="standings-table__display-name">{member.displayName}</span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('hits', {
        header: 'Aciertos',
        cell: (info) => (
          <span className="standings-table__hits">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('accuracyPct', {
        header: 'Efectividad',
        cell: (info) => (
          <span className="standings-table__pct">{info.getValue()}%</span>
        ),
      }),
      columnHelper.accessor('upsetHits', {
        header: () => (
          <span title="Aciertos en partidos sorpresa (≤25% del grupo)">
            🔮 Sorpresas
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="standings-table__badge standings-table__badge--upset">
              +{val}
            </span>
          ) : (
            <span className="standings-table__zero">-</span>
          );
        },
      }),
      columnHelper.accessor('humillaciones', {
        header: () => (
          <span title="Derrotas por 3+ goles apostando a perdedor">
            🤡 Humillado
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="standings-table__badge standings-table__badge--humillacion">
              {val}
            </span>
          ) : (
            <span className="standings-table__zero">-</span>
          );
        },
      }),
      columnHelper.accessor('somniferos', {
        header: () => (
          <span title="Apostó ganador en partido que terminó 0-0">
            😴 Somníferos
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="standings-table__badge standings-table__badge--somnifero">
              {val}
            </span>
          ) : (
            <span className="standings-table__zero">-</span>
          );
        },
      }),
      columnHelper.accessor('empatesFallidos', {
        header: () => (
          <span title="Apostó EMPATE pero hubo un ganador">
            🤷‍♂️ Empates Rotos
          </span>
        ),
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="standings-table__badge standings-table__badge--empate">
              {val}
            </span>
          ) : (
            <span className="standings-table__zero">-</span>
          );
        },
      }),
      columnHelper.accessor('currentStreak', {
        header: 'Racha',
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="standings-table__streak">🔥 {val}</span>
          ) : (
            <span className="standings-table__zero">0</span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data || data.length === 0) {
    return (
      <div className="standings-table__empty">
        <p>Aún no hay puntuaciones registradas para esta jornada.</p>
      </div>
    );
  }

  return (
    <div className="standings-table__wrapper">
      <table className="standings-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={canSort ? 'standings-table__th--sortable' : ''}
                  >
                    <div className="standings-table__header-content">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className="standings-table__sort-icon">
                          {sortDir === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : sortDir === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={`standings-table__row standings-table__row--rank-${row.original.rank}`}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
