import * as yup from 'yup';

export const recommendationsFormValidationSchema = (preferencesData) =>
	yup.object().shape({
		idealMatchMethods:
			yup
				.array()
				.of(
					yup.object().shape({
						label: yup.string().required(),
						value: yup.string().required()
					})
				)
				.min(1, 'Required'),
		idealMatchGenres:
			yup
				.array()
				.of(
					yup.object().shape({
						label: yup.string().required(),
						value: yup.string().required()
					})
				)
				.min(1, 'Required'),
		idealMatchGoals:
			yup
				.array()
				.of(
					yup.object().shape({
						label: yup.string().required(),
						value: yup.string().required()
					})
				)
				.min(1, 'Required'),
		idealMatchGender: yup.object()
			.shape({
				label: yup.string(),
				value: yup.string()
			})
			.required('Required')
			.typeError('Required'),
		idealMatchAge: yup.object()
			.shape({
				label: yup.string(),
				value: yup.string()
			})
			.required('Required')
			.typeError('Required'),
		idealMatchYearsOfExperience: yup.object()
			.shape({
				label: yup.string(),
				value: yup.string()
			})
			.required('Required')
			.typeError('Required'),
		idealMatchLocation: yup.object()
			.shape({
				label: yup.string(),
				value: yup.string()
			})
			.required('Required')
			.typeError('Required'),
		maxMatchRadius: yup
			.number()
			.min(5, 'Minimum 5 km')
			.max(500, 'Maximum 500 km')
			// .default(50)
			.notRequired()
			.default(preferencesData.maxMatchRadius),
	});