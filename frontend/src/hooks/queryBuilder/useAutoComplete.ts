import { isExistsNotExistsOperator } from 'container/QueryBuilder/filters/QueryBuilderSearch/utils';
import { Option } from 'container/QueryBuilder/type';
import { useCallback, useState } from 'react';
import { IBuilderQuery } from 'types/api/queryBuilder/queryBuilderData';
import { checkStringEndsWithSpace } from 'utils/checkStringEndsWithSpace';

import { useFetchKeysAndValues } from './useFetchKeysAndValues';
import { useOptions } from './useOptions';
import { useSetCurrentKeyAndOperator } from './useSetCurrentKeyAndOperator';
import { useTag } from './useTag';
import { useTagValidation } from './useTagValidation';

interface IAutoComplete {
	updateTag: (value: string) => void;
	handleSearch: (value: string) => void;
	handleClearTag: (value: string) => void;
	handleSelect: (value: string) => void;
	handleKeyDown: (event: React.KeyboardEvent) => void;
	options: Option[];
	tags: string[];
	searchValue: string;
	isMulti: boolean;
	isFetching: boolean;
}

export const useAutoComplete = (query: IBuilderQuery): IAutoComplete => {
	const [searchValue, setSearchValue] = useState<string>('');

	const handleSearch = (value: string): void => setSearchValue(value);

	const { keys, results, isFetching } = useFetchKeysAndValues(
		searchValue,
		query,
	);

	const [key, operator, result] = useSetCurrentKeyAndOperator(searchValue, keys);

	const {
		isValidTag,
		isExist,
		isValidOperator,
		isMulti,
		isFreeText,
	} = useTagValidation(searchValue, operator, result);

	const { handleAddTag, handleClearTag, tags, updateTag } = useTag(
		key,
		isValidTag,
		isFreeText,
		handleSearch,
		query,
	);

	const handleSelect = useCallback(
		(value: string): void => {
			if (isMulti) {
				setSearchValue((prev: string) => {
					if (prev.includes(value)) {
						return prev.replace(` ${value}`, '');
					}
					return checkStringEndsWithSpace(prev)
						? `${prev} ${value}`
						: `${prev} ${value},`;
				});
			}
			if (!isMulti && isValidTag && !isExistsNotExistsOperator(value)) {
				handleAddTag(value);
			}
			if (!isMulti && isExistsNotExistsOperator(value)) {
				handleAddTag(value);
			}
		},
		[handleAddTag, isMulti, isValidTag],
	);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent): void => {
			if (
				event.key === ' ' &&
				(searchValue.endsWith(' ') || searchValue.length === 0)
			) {
				event.preventDefault();
			}

			if (event.key === 'Enter' && searchValue && isValidTag) {
				if (isMulti || isFreeText) {
					event.stopPropagation();
				}
				event.preventDefault();
				handleAddTag(searchValue);
			}

			if (event.key === 'Backspace' && !searchValue) {
				event.stopPropagation();
				const last = tags[tags.length - 1];
				handleClearTag(last);
			}
		},
		[
			handleAddTag,
			handleClearTag,
			isFreeText,
			isMulti,
			isValidTag,
			searchValue,
			tags,
		],
	);

	const options = useOptions(
		key,
		keys,
		operator,
		searchValue,
		isMulti,
		isValidOperator,
		isExist,
		results,
		result,
	);

	return {
		updateTag,
		handleSearch,
		handleClearTag,
		handleSelect,
		handleKeyDown,
		options,
		tags,
		searchValue,
		isMulti,
		isFetching,
	};
};
