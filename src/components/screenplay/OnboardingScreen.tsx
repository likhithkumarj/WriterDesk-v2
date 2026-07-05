import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  PenTool, 
  Briefcase, 
  Award, 
  Clock, 
  Globe, 
  Heart, 
  Sparkles,
  Building,
  User
} from "lucide-react";
import { supabaseService } from "../../utils/supabaseService";

export interface OnboardingData {
  displayName: string;
  roles: string[];
  experienceLevel: string;
  productionHouseType: "independent" | "studio" | "";
  productionHouseName: string;
  writeFrequency: string;
  favoriteStoryteller: string;
}

interface OnboardingScreenProps {
  userId: string;
  defaultName: string;
  onComplete: (data: OnboardingData) => void;
  initialData?: OnboardingData;
}

export function OnboardingScreen({ userId, defaultName, onComplete, initialData }: OnboardingScreenProps) {
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(() => {
    // Attempt to load from saved progress draft first
    const saved = localStorage.getItem(`onboarding_draft:${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialData || {
      displayName: defaultName || "",
      roles: [],
      experienceLevel: "",
      productionHouseType: "",
      productionHouseName: "",
      writeFrequency: "",
      favoriteStoryteller: ""
    };
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const storytellerInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus inputs on steps that require input fields
  useEffect(() => {
    if (step === 1 && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (step === 4 && data.productionHouseType === "studio" && prodInputRef.current) {
      prodInputRef.current.focus();
    } else if (step === 6 && storytellerInputRef.current) {
      storytellerInputRef.current.focus();
    }
  }, [step, data.productionHouseType]);

  // Automatically save onboarding draft state in case page is closed
  useEffect(() => {
    localStorage.setItem(`onboarding_draft:${userId}`, JSON.stringify(data));
  }, [data, userId]);

  const handleNext = () => {
    if (step < 7) {
      setStep(prev => prev + 1);
    } else {
      // Clear draft since it is fully completed
      localStorage.removeItem(`onboarding_draft:${userId}`);
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Clear field value on skip for specific steps
    if (step === 3) {
      setData(prev => ({ ...prev, experienceLevel: "" }));
    } else if (step === 4) {
      setData(prev => ({ ...prev, productionHouseType: "", productionHouseName: "" }));
    } else if (step === 5) {
      setData(prev => ({ ...prev, writeFrequency: "" }));
    } else if (step === 6) {
      setData(prev => ({ ...prev, favoriteStoryteller: "" }));
    }
    handleNext();
  };

  const toggleRole = (role: string) => {
    setData(prev => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  // Step render helpers
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <User size={24} />
        </div>
        <h3 className="text-xl font-bold text-white">What should we call you?</h3>
        <p className="text-slate-400 text-sm">This is how you will appear to collaborators.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Display Name</label>
        <input
          ref={nameInputRef}
          type="text"
          value={data.displayName}
          onChange={e => setData(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="e.g. Likhith Kumar"
          className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
        />
      </div>
      <button
        onClick={handleNext}
        disabled={!data.displayName.trim()}
        className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );

  const renderStep2 = () => {
    const rolesList = [
      "Writer", "Screenwriter", "Director", "Producer", "Executive Producer",
      "Assistant Director", "Script Supervisor", "Story Editor", "Showrunner",
      "Actor", "Cinematographer", "Editor", "Student", "Other"
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Briefcase size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">What's your role?</h3>
          <p className="text-slate-400 text-sm">Select all that apply.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
          {rolesList.map(r => {
            const selected = data.roles.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className={`py-3 px-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                  selected
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={data.roles.length === 0}
            className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const levels = ["First time writing", "Beginner", "Intermediate", "Professional"];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Award size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">What's your experience level?</h3>
          <p className="text-slate-400 text-sm">Select one.</p>
        </div>

        <div className="space-y-3">
          {levels.map(l => {
            const selected = data.experienceLevel === l;
            return (
              <button
                key={l}
                onClick={() => setData(prev => ({ ...prev, experienceLevel: l }))}
                className={`w-full py-4 px-5 rounded-xl border text-left text-sm font-semibold transition-all ${
                  selected
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={data.experienceLevel ? handleNext : handleSkip}
            className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {data.experienceLevel ? "Continue" : "Skip"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Building size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Do you work with a production house?</h3>
          <p className="text-slate-400 text-sm">Select your current setup.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setData(prev => ({ ...prev, productionHouseType: "independent", productionHouseName: "" }))}
            className={`py-4 px-4 rounded-xl border text-center text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
              data.productionHouseType === "independent"
                ? "bg-amber-500/10 border-amber-500 text-amber-400"
                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            <User size={18} />
            Independent Writer
          </button>
          <button
            onClick={() => setData(prev => ({ ...prev, productionHouseType: "studio" }))}
            className={`py-4 px-4 rounded-xl border text-center text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 ${
              data.productionHouseType === "studio"
                ? "bg-amber-500/10 border-amber-500 text-amber-400"
                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            <Building size={18} />
            Production House
          </button>
        </div>

        {data.productionHouseType === "studio" && (
          <div className="space-y-2 animate-fade-in">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Production House Name</label>
            <input
              ref={prodInputRef}
              type="text"
              value={data.productionHouseName}
              onChange={e => setData(prev => ({ ...prev, productionHouseName: e.target.value }))}
              placeholder="e.g. Warner Bros, A24"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={
              data.productionHouseType === "independent" || (data.productionHouseType === "studio" && data.productionHouseName.trim())
                ? handleNext
                : handleSkip
            }
            className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {data.productionHouseType ? "Continue" : "Skip"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const frequencies = ["Daily", "3–5 times/week", "Weekly", "Whenever inspiration hits"];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">How often do you plan to write?</h3>
          <p className="text-slate-400 text-sm">Select one.</p>
        </div>

        <div className="space-y-3">
          {frequencies.map(f => {
            const selected = data.writeFrequency === f;
            return (
              <button
                key={f}
                onClick={() => setData(prev => ({ ...prev, writeFrequency: f }))}
                className={`w-full py-4 px-5 rounded-xl border text-left text-sm font-semibold transition-all ${
                  selected
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={data.writeFrequency ? handleNext : handleSkip}
            className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {data.writeFrequency ? "Continue" : "Skip"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Heart size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Who's your favorite storyteller?</h3>
          <p className="text-slate-400 text-sm">Optional</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Storyteller / Filmmaker</label>
          <input
            ref={storytellerInputRef}
            type="text"
            value={data.favoriteStoryteller}
            onChange={e => setData(prev => ({ ...prev, favoriteStoryteller: e.target.value }))}
            placeholder="e.g. Christopher Nolan, S. S. Rajamouli, Quentin Tarantino"
            className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3.5 px-4 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={data.favoriteStoryteller.trim() ? handleNext : handleSkip}
            className="flex-1 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            {data.favoriteStoryteller.trim() ? "Continue" : "Skip"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    return (
      <div className="space-y-8 animate-fade-in text-center py-4">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight">You're all set!</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            Welcome to WriterDesk, {data.displayName}. Your clean workspace is prepared for your next screenplay.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-base hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
          >
            Let's create your first project <ArrowRight size={18} />
          </button>
          
          <button
            onClick={handleBack}
            className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-400 font-semibold text-xs transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Background decoration gradient blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Main Card container */}
      <div className="relative w-full max-w-md bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        
        {/* Step indicator header */}
        {step < 7 && (
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Step {step} of 6
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step 
                      ? "w-6 bg-amber-500" 
                      : i < step 
                        ? "w-2 bg-amber-500/45" 
                        : "w-2 bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic step views */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}

        {/* Global style injection for animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
      </div>
    </div>
  );
}
