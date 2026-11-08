/**
 * The data-quality gate between raw records and everything that reads them.
 * `prepareDataset` validates once; errors block use (`usable: false`), warnings
 * travel with the prepared dataset so projections can display them.
 */
import { validateDataset } from './validate.ts';
import type { Dataset, QualityIssue } from './types.ts';

export interface PreparedDataset {
  readonly kind: 'prepared-dataset';
  readonly dataset: Dataset;
  readonly issues: readonly QualityIssue[];
  readonly errors: readonly QualityIssue[];
  readonly warnings: readonly QualityIssue[];
  /** `errors.length === 0` */
  readonly usable: boolean;
  /** Issues by related id (measurement, product or source). */
  readonly issuesById: ReadonlyMap<string, readonly QualityIssue[]>;
}

export function prepareDataset(dataset: Dataset): PreparedDataset {
  const issues = validateDataset(dataset);
  const byId = new Map<string, QualityIssue[]>();
  for (const issue of issues) {
    for (const id of issue.relatedIds) {
      const list = byId.get(id) ?? [];
      list.push(issue);
      byId.set(id, list);
    }
  }
  const errors = issues.filter((i) => i.severity === 'error');
  return {
    kind: 'prepared-dataset',
    dataset,
    issues,
    errors,
    warnings: issues.filter((i) => i.severity === 'warning'),
    usable: errors.length === 0,
    issuesById: byId,
  };
}

export function isPreparedDataset(value: Dataset | PreparedDataset): value is PreparedDataset {
  return (value as PreparedDataset).kind === 'prepared-dataset';
}

/** Accepts either form; a raw dataset is validated on the spot. */
export function ensurePrepared(value: Dataset | PreparedDataset): PreparedDataset {
  return isPreparedDataset(value) ? value : prepareDataset(value);
}

/**
 * Throw when the dataset has validation errors. Use at application start:
 * a dataset that fails the gate must never reach a view or an export.
 */
export function assertUsable(value: Dataset | PreparedDataset): PreparedDataset {
  const prepared = ensurePrepared(value);
  if (!prepared.usable) {
    const summary = prepared.errors.map((e) => `${e.code} @ ${e.path}`).join('; ');
    throw new Error(`Dataset has ${prepared.errors.length} validation error(s): ${summary}`);
  }
  return prepared;
}
