import type { GlobalConfig as StateGlobalConfig } from '@airma/react-state';
import type { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;
