import styles from "@/app/access/access.module.css";

const stepLabels = [
  "Знакомство",
  "Сценарий",
  "Возможности",
  "Профиль",
  "Подготовка",
  "Готово",
] as const;

type AccessProgressProps = {
  currentStep: number;
};

export function AccessProgress({ currentStep }: AccessProgressProps) {
  const currentLabel = stepLabels[currentStep - 1] ?? stepLabels[0];

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={`Шаг ${currentStep} из ${stepLabels.length} — ${currentLabel.toLowerCase()}`}
      aria-valuemin={1}
      aria-valuemax={stepLabels.length}
      aria-valuenow={currentStep}
    >
      <div className={styles.progressText}>
        <strong>Шаг {currentStep} из {stepLabels.length}</strong>
        <span>{currentLabel}</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            data-active={index + 1 <= currentStep || undefined}
          />
        ))}
      </div>
    </div>
  );
}
