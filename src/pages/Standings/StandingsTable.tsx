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
import { ArrowUpDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { UserAvatar } from '../../components/common/UserAvatar';
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
          const member = info.row.original;
          const rank = info.getValue();
          const rankDelta = member.rankDelta;
          let trend: React.ReactNode = null;
          let trendType = 'steady';
          let trendLabel = '';

          if (!isWeeklyView && rankDelta !== null && rankDelta !== undefined) {
            if (rankDelta > 0) {
              trend = <><ArrowUp size={13} aria-hidden="true" /><span>+{rankDelta}</span></>;
              trendType = 'up';
              trendLabel = `subió ${rankDelta}`;
            } else if (rankDelta < 0) {
              trend = <><ArrowDown size={13} aria-hidden="true" /><span>-{Math.abs(rankDelta)}</span></>;
              trendType = 'down';
              trendLabel = `bajó ${Math.abs(rankDelta)}`;
            } else {
              trend = <><Minus size={13} aria-hidden="true" /><span>0</span></>;
              trendLabel = 'se mantuvo';
            }
          }

          return (
            <span className="standings-table__rank">
              <span className="standings-table__rank-number">{rank}</span>
              {trend && (
                <span
                  className={`standings-table__trend standings-table__trend--${trendType}`}
                  aria-label={`Cambio de posición: ${trendLabel}`}
                >
                  {trend}
                </span>
              )}
            </span>
          );
        },
      }),
      columnHelper.accessor('alias', {
        header: 'Participante',
        cell: (info) => {
          const member = info.row.original;
          return (
            <div className="standings-table__member">
              <UserAvatar
                src={member.avatarUrl}
                alt={member.alias}
                size="sm"
              />
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
            Sorpresas
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
            Humillado
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
            Somníferos
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
            Empates Rotos
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
            <span className="standings-table__streak">{val}</span>
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
