import type { Prediction } from "@/lib/types";
import { evaluatePrediction } from "@/lib/actions/predictions";

export default function PredictionEvaluationForm({ prediction }: { prediction: Prediction }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs link-quiet">Evaluate</summary>
      <form action={evaluatePrediction.bind(null, prediction.id)} className="mt-2 space-y-2">
        <select className="input" name="status" defaultValue={prediction.status}>
          <option value="proposed">Proposed</option>
          <option value="under_evaluation">Under evaluation</option>
          <option value="developing">Developing</option>
          <option value="validated">Validated</option>
          <option value="contradicted">Contradicted</option>
          <option value="expired">Expired (horizon passed, can't evaluate)</option>
          <option value="unable_to_evaluate">Unable to evaluate</option>
        </select>
        <textarea className="input" name="observed_outcome" rows={2} placeholder="What actually happened?" />
        <textarea className="input" name="variance" rows={2} placeholder="Variance from what was expected" />
        <select className="input" name="variance_reason" defaultValue="">
          <option value="">Variance reason (if applicable)</option>
          <option value="execution">Execution</option>
          <option value="market">Market</option>
          <option value="data_quality">Data quality</option>
          <option value="reasoning_error">Reasoning error</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="btn-secondary">
          Save evaluation
        </button>
      </form>
    </details>
  );
}
