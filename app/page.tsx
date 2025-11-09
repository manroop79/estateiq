import Image from "next/image";

export default function Page(){
    return (
      <div>
         <a href="/vault" className="fixed md:top-4 top-6 right-4 z-[60] px-6 py-3 bg-black text-white hover:bg-[var(--primary)] transition-colors rounded-lg shadow-md">Open Vault</a>

        <div className="pt-20 md:pt-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center">
            
            {/* Left: Image */}
            <div className="flex flex-col justify-center items-center">
              <div className="relative w-full max-w-md aspect-square overflow-hidden mx-auto">
                <Image src="/hero.jpg" alt="Property compliance illustration" fill className="object-cover" />
              </div>
              <p className="md:-mt-14 -mt-8 text-xs italic text-gray-300 text-center">Powered by AI • Real-time Analysis</p>
            </div>

            {/* Right: Content */}
            <div className="md:mt-20 mt-4 flex flex-col space-y-3 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-white">
                Welcome to <span className="inline-block bg-gradient-to-r from-[var(--primary)] via-[var(--primary-2)] to-[var(--accent)] bg-clip-text text-transparent animate-pulse-scale filter brightness-110 drop-shadow-lg hover:drop-shadow-xl hover:scale-110 transition-all duration-300">EstateIQ</span>. <span className="font-light text-gray-300">AI insights and analysis for your real estate documents.</span>
              </h1>
              
              <div className="text-sm font-semibold text-gray-400">
                Entity Extraction + Compliance Checks + AI Insights
              </div>

                <a href="/vault" className="group inline-block w-fit mx-auto md:mx-0 px-6 py-3 bg-white text-gray-900 rounded-md shadow-md font-medium relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                    <span className="group-hover:rotate-[360deg] transition-transform duration-500">Get Started with Vault</span>
                  </span>
                </a>

            </div>

          </div>
        </div>
      </div>
  );
}

// function Stat({ label, value }: { label: string, value: string }) {
//   return (
//     <div className="glass rounded-lg p-4 flex flex-col items-center">
//       <div className="text-lg font-medium">{label}</div>
//       <div className="text-2xl font-bold mt-1">{value}</div>
//     </div>
//   );
// }