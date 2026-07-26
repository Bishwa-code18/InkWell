// components/shared/Avatar.jsx — Flexible avatar: accepts user object OR src/alt props
import { cn } from '../../utils/cn';

const sizeMap = {
  xs:  { cls: 'w-5 h-5 text-[10px]', px: 20  },
  sm:  { cls: 'w-7 h-7 text-xs',     px: 28  },
  md:  { cls: 'w-9 h-9 text-sm',     px: 36  },
  lg:  { cls: 'w-12 h-12 text-base', px: 48  },
  xl:  { cls: 'w-16 h-16 text-xl',   px: 64  },
  '2xl': { cls: 'w-20 h-20 text-2xl', px: 80 },
};

/**
 * Avatar props (two call signatures):
 *  <Avatar user={userObj} size="md" />
 *  <Avatar src="url" alt="name" size={32} />   ← numeric size = px
 */
export default function Avatar({ user, src, alt, size = 'md', className, online }) {
  // Accept either a user object or raw src/alt
  const imgSrc    = user?.avatar || src;
  const nameStr   = user?.displayName || user?.username || alt || '';
  const initials  = nameStr
    ? nameStr.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  // Numeric size support (e.g. size={32})
  let sizeClass, sizeStyle;
  if (typeof size === 'number') {
    sizeClass = '';
    sizeStyle = { width: size, height: size, fontSize: size * 0.4 };
  } else {
    sizeClass = (sizeMap[size] || sizeMap.md).cls;
    sizeStyle = {};
  }

  return (
    <div className={cn('relative flex-shrink-0 inline-flex', className)} style={sizeStyle}>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={nameStr || 'avatar'}
          loading="lazy"
          className={cn('rounded-full object-cover bg-gray-200 w-full h-full', sizeClass)}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.style.setProperty('display', 'flex');
          }}
        />
      ) : null}
      <div
        className={cn(
          'rounded-full bg-primary/10 text-primary font-semibold items-center justify-center w-full h-full',
          sizeClass,
          imgSrc ? 'hidden' : 'flex'
        )}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-white',
          typeof size === 'number' ? 'w-2.5 h-2.5' : 'w-3 h-3',
          online ? 'bg-green-500' : 'bg-gray-400'
        )} />
      )}
    </div>
  );
}
