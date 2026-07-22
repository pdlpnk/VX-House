import "server-only";

export type MetricLabels = Readonly<Record<string, string>>;

export type MetricMeasurement =
  | Readonly<{ instrument: "counter"; name: string; value: number; labels: MetricLabels }>
  | Readonly<{ instrument: "gauge"; name: string; value: number; labels: MetricLabels }>
  | Readonly<{ instrument: "histogram"; name: string; value: number; labels: MetricLabels }>;

export interface MetricSink {
  record(measurement: MetricMeasurement): void | Promise<void>;
}

export class NoopMetricSink implements MetricSink {
  record() {}
}

const METRIC_NAME_PATTERN = /^[a-z][a-z0-9_.]{2,119}$/;
const LABEL_KEY_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const FORBIDDEN_LABEL = /(email|ip|name|session|token|user|identifier|secret)/i;

function validateMeasurement(measurement: MetricMeasurement) {
  if (!METRIC_NAME_PATTERN.test(measurement.name)) throw new TypeError("Некорректное имя метрики");
  if (!Number.isFinite(measurement.value)) throw new TypeError("Некорректное значение метрики");
  for (const [key, value] of Object.entries(measurement.labels)) {
    if (!LABEL_KEY_PATTERN.test(key) || FORBIDDEN_LABEL.test(key) || value.length > 80) {
      throw new TypeError("Некорректная или высококардинальная label метрики");
    }
  }
}

export class OperationalMetrics {
  constructor(private readonly sink: MetricSink = new NoopMetricSink()) {}

  record(measurement: MetricMeasurement) {
    validateMeasurement(measurement);
    return this.sink.record(Object.freeze(measurement));
  }

  increment(name: string, labels: MetricLabels = {}, value = 1) {
    if (value < 0) throw new TypeError("Counter не может уменьшаться");
    return this.record({ instrument: "counter", name, value, labels });
  }

  gauge(name: string, value: number, labels: MetricLabels = {}) {
    return this.record({ instrument: "gauge", name, value, labels });
  }

  observe(name: string, value: number, labels: MetricLabels = {}) {
    return this.record({ instrument: "histogram", name, value, labels });
  }
}
