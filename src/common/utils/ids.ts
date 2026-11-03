import { customAlphabet, nanoid } from 'nanoid';
import {
  API_TOKEN_LENGTH,
  API_TOKEN_PREFIX,
  USER_CODE_ALPHABET,
} from '../../config/constants';

const userCodePart = customAlphabet(USER_CODE_ALPHABET, 4);

export const newId = (): string => nanoid();

export const newApiToken = (): string =>
  `${API_TOKEN_PREFIX}${nanoid(API_TOKEN_LENGTH)}`;

export const newUserCode = (): string => `${userCodePart()}-${userCodePart()}`;
