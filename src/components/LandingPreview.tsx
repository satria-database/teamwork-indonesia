import {
  Sparkles,
  UserCheck,
  Layers,
  Cpu,
  Compass,
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
  features: Layers,
  skills: Cpu,
  cta: Compass,
};

/**
 * Mini visual preview of the landing page based on the current (unsaved) config draft.
 * Renders a scaled-down representation of each enabled section in order.
 */
export function LandingPreview({ config, cvData }: LandingPreviewProps) {
  const cv = cvData || DEFAULT_CV_SATRIA;

  const isSectionEnabled = (id: LandingSectionId): boolean => {
    switch (id) {
      case "hero": return config.showHeroSection;
      case "cv": return config.showCVSection;
      case "features": return config.showFeaturesSection;
      case "skills": return config.showSkillsSection;
      case "cta": return config.showCTASection;
      default: return true;
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
              case "features":
                return <PreviewSimple key={sectionId} icon={Layers} label={meta?.label || "Fitur"} color="violet" />;
              case "skills":
                return <PreviewSimple key={sectionId} icon={Cpu} label={meta?.label || "Keahlian"} color="amber" />;
              case "cta":
                return <PreviewCTA key={sectionId} />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}

/* --- Hero --- */
function PreviewHero({ config, cv }: { config: LandingPageConfig; cv: CVData }) {
  return (
    <div className="px-6 py-8 text-center bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-500 mb-3">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {cv.nama_lengkap || "Satria Nur Ardiansyah"}
        </span>
        <span className="text-slate-300">•</span>
        <span>{config.heroBadgeText || cv.headline || "Technical Data Support"}</span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {config.heroTitle || "WorkSpace & Portfolio"}
      </h1>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {config.heroSubtitle ||
          "Catatan pekerjaan, jadwal, dokumen, dan portofolio saya dalam satu tempat."}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-semibold">
          Jelajahi Workspace
        </span>
        <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
          Lihat Portofolio CV
        </span>
      </div>
    </div>
  );
}

/* --- CV --- */
function PreviewCV({ config, cv }: { config: LandingPageConfig; cv: CVData }) {
  return (
    <div className="px-6 py-5 bg-white dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center gap-1.5 mb-2">
        <UserCheck className="size-3 text-indigo-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Curriculum Vitae Resmi
        </span>
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
        {/* Identity */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {cv.nama_lengkap.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 3).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{cv.nama_lengkap}</p>
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
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100">{exp.posisi}</p>
                  <p className="text-[9px] text-slate-400">{exp.perusahaan} • {exp.periode}</p>
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
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate">{edu.institusi}</p>
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
              {(config.skillsBadges.length > 0 ? config.skillsBadges : cv.keahlian).slice(0, 6).map((skill, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
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
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">{item}</span>
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
function PreviewSimple({ icon: Icon, label, color }: { icon: typeof Sparkles; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900",
    amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900",
  };
  return (
    <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
      <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${colorMap[color] || colorMap.violet}`}>
        <Icon className="size-3.5" />
        <span className="text-[10px] font-bold">{label}</span>
      </div>
    </div>
  );
}

/* --- CTA --- */
function PreviewCTA() {
  return (
    <div className="px-6 py-5 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-center">
      <h3 className="text-sm font-bold text-white">Mulai Bekerja di Ruang Kerja WorkHub</h3>
      <p className="text-[10px] text-slate-300 mt-1 max-w-xs mx-auto">
        Masuk untuk mengakses seluruh fitur pencatatan dan manajemen arsip.
      </p>
      <span className="inline-block mt-2.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-[10px] font-bold">
        Masuk ke Workspace
      </span>
    </div>
  );
}
