import { GlobalConfig as StateGlobalConfig } from '@airma/react-state';
import { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;
