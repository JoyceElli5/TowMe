declare module 'hugeicons-react-native' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  interface IconProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
    style?: ViewStyle | TextStyle;
  }

  // Export all icons - using index signature to allow any icon name
  export const MapsIcon: ComponentType<IconProps>;
  export const UserCircleIcon: ComponentType<IconProps>;
  export const ArrowLeft: ComponentType<IconProps>;
  export const ArrowRight: ComponentType<IconProps>;
  export const CheckmarkCircle: ComponentType<IconProps>;
  export const Star: ComponentType<IconProps>;
  export const Car: ComponentType<IconProps>;
  export const Location: ComponentType<IconProps>;
  export const Flag: ComponentType<IconProps>;
  export const Call: ComponentType<IconProps>;
  export const Camera: ComponentType<IconProps>;
  export const Download: ComponentType<IconProps>;
  export const CloseCircle: ComponentType<IconProps>;
  export const Moon: ComponentType<IconProps>;
  export const Sun: ComponentType<IconProps>;
  export const Notifications: ComponentType<IconProps>;
  export const Chat: ComponentType<IconProps>;
  export const Mail: ComponentType<IconProps>;
  export const Card: ComponentType<IconProps>;
  export const Phone: ComponentType<IconProps>;
  export const Wallet: ComponentType<IconProps>;
  export const Ban: ComponentType<IconProps>;
  export const Headset: ComponentType<IconProps>;
  export const HelpCircle: ComponentType<IconProps>;
  export const Document: ComponentType<IconProps>;
  export const Logout: ComponentType<IconProps>;
  export const ChevronRight: ComponentType<IconProps>;
  export const FilterIcon: ComponentType<IconProps>;
  export const NavigateIcon: ComponentType<IconProps>;
  export const CheckmarkDone01Icon: ComponentType<IconProps>;
  export const HandLeft01Icon: ComponentType<IconProps>;
  
  // Tab bar icons
  export const Home01Icon: ComponentType<IconProps>;
  export const TransactionIcon: ComponentType<IconProps>;
  export const UserIcon: ComponentType<IconProps>;
  export const Notification01Icon: ComponentType<IconProps>;
  
  // Additional icons
  export const StarIcon: ComponentType<IconProps>;
  export const Route01Icon: ComponentType<IconProps>;
  export const Location01Icon: ComponentType<IconProps>;
  export const Wallet01Icon: ComponentType<IconProps>;
  export const CheckmarkCircle01Icon: ComponentType<IconProps>;
  export const AlertCircleIcon: ComponentType<IconProps>;
  export const ArrowRight01Icon: ComponentType<IconProps>;
  export const Camera01Icon: ComponentType<IconProps>;
  export const Logout01Icon: ComponentType<IconProps>;
  export const Chatting01Icon: ComponentType<IconProps>;
  export const SmartPhone01Icon: ComponentType<IconProps>;
  export const LegalDocument01Icon: ComponentType<IconProps>;
  export const MessageDone01Icon: ComponentType<IconProps>;
}

