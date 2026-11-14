import { GraduationCap } from "lucide-react";

export default function AuthBrand({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg ${
          light ? "bg-white text-slate-950" : "bg-slate-950 text-white"
        }`}
      >
        <GraduationCap size={22} strokeWidth={1.8} aria-hidden="true" />
      </div>

      <div>
        <p
          className={`text-sm font-bold tracking-wide ${
            light ? "text-white" : "text-slate-950"
          }`}
        >
          ARSI UNIVERSITY
        </p>

        <p className="text-xs text-slate-400">Evasu Fellowship Portal</p>
      </div>
    </div>
  );
}