import {
  Sparkles,
  UserCheck,
  Cpu,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import {
  type LandingPageConfig,
  type LandingSectionId,
  ALL_LANDING_SECTIONS,
} from "@/lib/landingConfig";
import { DEFAULT_CV_SATRIA, type CVData } from "@/lib/cvData";

interface LandingPreviewProps {
  config: LandingPageConfig;
  cvData?: CVData;
}

const SECTION_ICONS: Partial<Record<LandingSectionId, typeof Sparkles>> = {
  hero: Sparkles,
  cv: UserCheck,
  skills: Cpu,
};

/**
 * Mini visual preview of the landing page based on the current (unsaved) config draft.
 * Renders a scaled-down representation of each enabled section in order.
 */
export function LandingPreview({ config, cvData }: LandingPreviewProps) {
  const cv = cvData || DEFAULT_CV_SATRIA;

  const isSectionEnabled = (id: LandingSectionId): boolean => {
    switch (id) {
      case "hero":
        return config.showHeroSection;
      case "cv":
        return config.showCVSection;
      case "skills":
        return config.showSkillsSection;
      default:
        return true;
    }
  };

  const enabledCount = config.sectionOrder.filter(isSectionEnabled).length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-950 shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="size-2.5 rounded-full bg-rose-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] font-medium text-slate-400 truncate">
          noura-landing-preview • {enabledCount} bagian aktif
        </span>
      </div>

      {/* Preview viewport */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="bg-slate-50/50 dark:bg-slate-950">
          {config.sectionOrder.map((sectionId) => {
            if (!isSectionEnabled(sectionId)) return null;
            const meta = ALL_LANDING_SECTIONS.find((s) => s.id === sectionId);

            switch (sectionId) {
              case "hero":
                return <PreviewHero key={sectionId} config={config} cv={cv} />;
              case "cv":
                return <PreviewCV key={sectionId} config={config} cv={cv} />;
              case "skills":
                return (
                  <PreviewSimple
                    key={sectionId}
                    icon={Cpu}
                    label={meta?.label || "Keahlian"}
                    color="amber"
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}

/* --- Hero (Lampiran 2) --- */
function PreviewHero({ config, cv }: { config: LandingPageConfig; cv: CVData }) {
  return (
    <div className="px-5 py-6 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800 text-left">
      <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
        {config.heroTitle || "Workspace & Portofolio"}
      </h1>

      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="size-11 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700">
              {(config.heroName || cv.nama_lengkap || "SNA")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                {config.heroName || cv.nama_lengkap || "SATRIA NUR ARDIANSYAH"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Jabatan saat ini :</p>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
              {config.heroCurrentJobTitle || "Cataloger Elins"}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {config.heroCurrentCompany || "PT Sonar Persada Manunggal"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[9px] font-semibold text-center">
            Jelajahi Workspace
          </span>
          <span className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-medium text-center">
            Lihat Portofolio CV
          </span>
        </div>
      </div>

      <div className="w-8 h-0.5 bg-blue-600 rounded-full my-2.5" />

      <div>
        <p className="text-[11px] font-bold text-slate-900 dark:text-white mb-1.5">
          {config.heroJobSectionTitle || "Job saat ini :"}
        </p>
        <ul className="space-y-1">
          {(config.heroJobResponsibilities || []).slice(0, 3).map((job, idx) => (
            <li
              key={idx}
              className="flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"
            >
              <span className="size-1 rounded-full bg-blue-600 mt-1 shrink-0" />
              <span className="line-clamp-1">{job}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --- CV --- */
function PreviewCV({ config, cv }: { config: LandingPageConfig; cv: CVData }) {
  return (
    <div className="px-6 py-5 bg-white dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          CURRICULUM VITAE
        </p>
        <p className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">
          {cv.nama_lengkap || "SATRIA NUR ARDIANSYAH"}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
        {/* Identity */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {cv.nama_lengkap
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 3)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {cv.nama_lengkap}
            </p>
            <p className="text-[10px] text-indigo-500 truncate">{cv.headline}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[8px] text-emerald-500">
            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
            Realtime
          </span>
        </div>

        {/* Contact */}
        {config.showCVContactInfo && (
          <div className="flex flex-wrap gap-1.5 py-2 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1 text-[9px] text-slate-500 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <MapPin className="size-2.5 text-indigo-400" /> {cv.alamat}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-slate-500 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Phone className="size-2.5 text-indigo-400" /> {cv.telepon}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-slate-500 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <Mail className="size-2.5 text-indigo-400" /> {cv.email}
            </span>
          </div>
        )}

        {/* About */}
        {config.showCVAbout && (
          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed py-2 border-b border-slate-200 dark:border-slate-800 line-clamp-2">
            {cv.tentang_saya}
          </p>
        )}

        {/* Experience */}
        {config.showCVExperience && (
          <div className="py-2 border-b border-slate-200 dark:border-slate-800">
            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <Briefcase className="size-2.5 text-indigo-400" /> Pengalaman
            </p>
            <div className="space-y-1.5">
              {cv.pengalaman.slice(0, 2).map((exp) => (
                <div key={exp.id}>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100">
                    {exp.posisi}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {exp.perusahaan} • {exp.periode}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {config.showCVEducation && (
          <div className="py-2 border-b border-slate-200 dark:border-slate-800">
            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <GraduationCap className="size-2.5 text-indigo-400" /> Pendidikan
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {cv.pendidikan.slice(0, 2).map((edu) => (
                <div key={edu.id}>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {edu.institusi}
                  </p>
                  <p className="text-[9px] text-indigo-400 truncate">{edu.jurusan}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {config.showCVSkills && (
          <div className="py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {config.skillsHeader || "Keahlian Utama"}
            </p>
            <div className="flex flex-wrap gap-1">
              {(config.skillsBadges.length > 0 ? config.skillsBadges : cv.keahlian)
                .slice(0, 6)
                .map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                  >
                    {skill}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Specialization */}
        {config.showSkillsSection && (
          <div className="py-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {config.specializationHeader || "Spesialisasi Kompetensi"}
            </p>
            <div className="space-y-1">
              {config.specializationItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-2.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Simple section placeholder --- */
function PreviewSimple({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Sparkles;
  label: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900",
  };
  return (
    <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
      <div
        className={`flex items-center gap-2 p-2.5 rounded-xl border ${colorMap[color] || colorMap["violet"]}`}
      >
        <Icon className="size-3.5" />
        <span className="text-[10px] font-bold">{label}</span>
      </div>
    </div>
  );
}
