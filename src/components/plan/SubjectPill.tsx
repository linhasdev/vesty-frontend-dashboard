interface SubjectPillProps {
  name: string;
  color: string;
  size?: 'tiny' | 'small' | 'normal';
}

export default function SubjectPill({ name, color, size = 'normal' }: SubjectPillProps) {
  let sizeClasses = '';
  let fontWeightClass = size === 'tiny' ? 'font-normal' : 'font-medium';
  
  if (size === 'tiny') {
    sizeClasses = 'px-1.5 py-0.5 text-xs my-0.5 mr-1 max-w-[90px] text-[10px]';
  } else if (size === 'small') {
    sizeClasses = 'px-2 py-0.5 text-xs my-0.5 mr-1 max-w-[120px]';
  } else {
    sizeClasses = 'px-3 py-1 text-xs my-1 mr-2 max-w-full sm:max-w-[180px]';
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