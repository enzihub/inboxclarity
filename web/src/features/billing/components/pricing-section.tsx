import { createCheckoutAction } from '../actions/create-checkout-action';
import { getProducts } from '../controllers/get-products';
import { PricingCard } from './price-card';

export async function PricingSection() {
  const products = await getProducts();

  return (
    <section className='w-full'>
      <div className='w-full'>
        <div className='max-w-5xl mx-auto px-4 py-8'>
          <div className='text-center space-y-4 max-w-4xl mx-auto py-12 px-8'>
            {/* <span className='inline-block px-4 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-900'>Profile</span> */}
            <h1 className='text-6xl font-semibold tracking-tight text-white/90'>Welcome,</h1>
            <h1 className='text-6xl font-semibold tracking-tight text-white/90'>Customize your preferences</h1>
            <p className='text-white/60 text-xl px-16 my-3'>
              Take control of your preferences to enjoy personalized summaries, delivered exactly how you like them.
            </p>
          </div>

          <div className='grid md:grid-cols-2 gap-4 mt-8'>
            <div>
              {/* Cards Grid */}
              <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
                {products[0].prices
                  .filter((price: any) => price.unit_amount > 0)
                  .map((price: any) => (
                    <div key={price.id} className={`flex h-full`}>
                      <div className='flex-1 flex'>
                        <div className='w-full flex flex-col'>
                          <PricingCard price={price} createCheckoutAction={createCheckoutAction} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // return (
  //   <section className='w-full'>
  //     <div className='w-full'>
  //       <div className='max-w-5xl mx-auto px-4'>
  //         {/* Header Section */}
  //         <div className='text-center space-y-4 mb-16'>
  //           <span className='inline-block px-4 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-900'>Pricing</span>
  //           <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Choose your plan ✨</h1>
  //           <p className='text-gray-500'>All plans include core features. Switch or cancel anytime.</p>
  //         </div>
  //
  //         {/* Cards Grid */}
  //         <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
  //           {products[0].prices.map((price: any) => (
  //             <div key={price.id} className={`flex h-full`}>
  //               <div className='flex-1 flex'>
  //                 <div className='w-full flex flex-col'>
  //                   <PricingCard price={price} createCheckoutAction={createCheckoutAction} />
  //                 </div>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //
  //         {/* Trust Badges */}
  //         <div className='py-8 md:mt-16 text-center'>
  //           <div className='flex justify-center items-center gap-8 flex-wrap'>
  //             <div className='flex items-center gap-2'>
  //               <svg className='w-5 h-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
  //                 <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
  //               </svg>
  //               <span className='text-sm text-gray-600'>Cancel anytime</span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </section>
  // );
}
