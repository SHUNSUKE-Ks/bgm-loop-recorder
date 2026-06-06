type AvailableNotesBarProps = {
  notes: string[];
  quality: string[];
  symbols: string[];
};

export function AvailableNotesBar(props: AvailableNotesBarProps) {
  const values = () => [...props.notes, ...props.quality, ...props.symbols].join(", ");

  return (
    <div class="border-y border-slate-200 bg-white px-6 py-2">
      <p class="overflow-x-auto whitespace-nowrap text-sm font-bold text-slate-600">{values()}</p>
    </div>
  );
}
