interface SubjectPillProps {
  name: string;
  color: string;
  size?: 'micro' | 'tiny' | 'small' | 'normal';
}

export default function SubjectPill({ name, color, size = 'normal' }: SubjectPillProps) {
  let sizeClasses = '';
  let fontWeightClass = size === 'tiny' || size === 'micro' ? 'font-normal' : 'font-medium';
  
  if (size === 'micro') {
    sizeClasses = 'px-1 py-0 text-[8px] my-0.5 mr-0.5 max-w-[60px]';
  } else if (size === 'tiny') {
    sizeClasses = 'px-1 sm:px-1.5 py-0 sm:py-0.5 text-[8px] sm:text-[10px] my-0.5 mr-0.5 sm:mr-1 max-w-[70px] sm:max-w-[90px]';
  } else if (size === 'small') {
    sizeClasses = 'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs my-0.5 mr-0.5 sm:mr-1 max-w-[100px] sm:max-w-[120px]';
  } else {
    sizeClasses = 'px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs my-0.5 sm:my-1 mr-1 sm:mr-2 max-w-[150px] sm:max-w-[180px]';
  }
  
  return (
    <div 
      className={`inline-block rounded-full text-white ${fontWeightClass} whitespace-nowrap overflow-hidden text-ellipsis ${sizeClasses}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {name}
    </div>
  );
} 