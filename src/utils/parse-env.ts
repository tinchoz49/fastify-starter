import type { Static } from '@sinclair/typebox'

import { AssertError } from '@sinclair/typebox/value'
import { type DeepPartial, parseEnv as parseEnvBase } from 'typebox-env'

import Schema from '../env.js'

export type EnvSchema = Static<typeof Schema>

export type EnvOptions = DeepPartial<EnvSchema>

export function parseEnv(data: Record<string, unknown>): EnvSchema {
  try {
    return parseEnvBase(Schema, data)
  } catch (err: any) {
    if (err instanceof AssertError) {
      throw new TypeError(`Failed to parse environment variables:\nPath: ${err.error?.path}\nMessage: ${err.error?.message}.\nValue: ${JSON.stringify(err.error?.value, null, 2)}`)
    }

    throw new TypeError(`Failed to parse environment variables ${err.message}`)
  }
}
