type TesterAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
  alt?: string;
};

const DEFAULT_TESTER_AVATAR = '/squash-logo-transparent.png';

export default function TesterAvatar({
  name,
  avatarUrl,
  className = '',
  imageClassName = '',
  alt = '',
}: TesterAvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-[#fff7f5] ring-1 ring-[#ecd6d2] ${className}`}
    >
      <img
        src={avatarUrl || DEFAULT_TESTER_AVATAR}
        alt={alt}
        className={avatarUrl ? `h-full w-full object-cover ${imageClassName}` : 'h-[72%] w-[72%] object-contain'}
        title={alt || (avatarUrl ? `${name} profile photo` : 'Default SQUASH profile image')}
      />
    </span>
  );
}
