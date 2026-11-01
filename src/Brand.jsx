import {APP_NAME} from './brand.js';
const asset=name=>`${import.meta.env.BASE_URL}${name}`;
export default function Brand({name=APP_NAME,full=false,loading=false}){
  const standard=name.toLowerCase()===APP_NAME.toLowerCase();
  return <div className={`olympia-brand ${full?'brand-full':'brand-inline'} ${loading?'brand-shine':''}`} role="img" aria-label={name}>
    {full&&standard?<img src={asset('logo.svg')} alt="" width="900" height="800" decoding="async"/>:<><img className="brand-emblem" src={asset('logo-emblem.svg')} alt="" width="512" height="512" loading="lazy" decoding="async"/>{standard?<img className="brand-wordmark" src={asset('logo-wordmark.svg')} alt="" width="900" height="240" loading="lazy" decoding="async"/>:<strong>{name}</strong>}</>}
    {loading&&<span className="brand-sheen" aria-hidden="true"/>}
  </div>;
}
