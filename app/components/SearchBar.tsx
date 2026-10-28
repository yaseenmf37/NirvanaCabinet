type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "جست‌وجو در پروژه‌ها، وظایف و کارکنان",
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <span aria-hidden="true">🔎</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
