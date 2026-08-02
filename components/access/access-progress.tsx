import styles from "@/app/access/access.module.css";
import { useI18n } from "@/components/i18n/i18n-provider";

const stepLabels = [
  "progress.role", "progress.profile", "progress.email", "progress.tasks",
  "progress.progress", "progress.manager", "progress.consents", "progress.done",
] as const;

type AccessProgressProps = {
  currentStep: number;
};

export function AccessProgress({ currentStep }: AccessProgressProps) {
  const { t } = useI18n();
  const currentLabel = t(stepLabels[currentStep - 1] ?? stepLabels[0]);
  const stepText = t("progress.step", { current: currentStep, total: stepLabels.length });

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-label={`${stepText} — ${currentLabel.toLowerCase()}`}
      aria-valuemin={1}
      aria-valuemax={stepLabels.length}
      aria-valuenow={currentStep}
      aria-valuetext={`${currentLabel}. ${stepText}`}
    >
      <div className={styles.progressText}>
        <strong>{stepText}</strong>
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
