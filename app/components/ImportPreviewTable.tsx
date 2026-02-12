"use client";

import React from 'react';
import styles from './ImportPreviewTable.module.css';

interface Props {
  data: {
    valid: any[];
    duplicates: any[];
    invalid: any[];
  };
}

export default function ImportPreviewTable({ data }: Props) {
  const maxRows = 80;
  const rows = [
    ...data.valid.map(r => ({ ...r, status: 'Novo' })),
    ...data.duplicates.map(r => ({ ...r, status: 'Duplicado' })),
    ...data.invalid.map(r => ({ ...r, status: 'Inválido' }))
  ].slice(0, maxRows);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Mesa</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className={styles.row}>
                <td>{r.full_name}</td>
                <td>{r.category || '—'}</td>
                <td>{r.table_number || '—'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.valid.length + data.duplicates.length + data.invalid.length > maxRows && (
        <div className={styles.note}>Mostrando primeiros {maxRows} linhas</div>
      )}
    </div>
  );
}
