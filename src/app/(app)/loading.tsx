import { LoadingState } from "@/components/states/loading-state";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <LoadingState rows={5} />
    </div>
  );
}
