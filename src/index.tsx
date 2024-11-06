import React, {
	useState,
	useEffect,
	useRef,
	ChangeEvent,
	KeyboardEvent,
} from 'react'
import getCaretCoordinates from 'textarea-caret'
import Suggest from './Suggest'

export type TextareaProps = {
	// List of items ans suggest
	list: any[]

	// Min characters for search
	minChar: number

	// Character of search, example /
	char: string

	// Max lenght of items in suggest
	maxSuggest: number

	// Make valid for Server Side Rendering
	ssr: boolean

	// Behavior in key navegations infinite || lock
	mode: 'infinite' | 'lock'

	// Adds the character when is selected
	addChar: boolean

	// Restrict ul list position in the parent's width
	limitToParent: boolean

	// Adds the character in the select list
	showCharInList: boolean

	// Accept spaces after, example #seveal words
	acceptSpaces: boolean

	// spellcheck
	spellcheck: boolean

	// Class css in the ul list
	listClass: string

	// Pass a className in the li item
	// active or inactive
	activeItemClass: React.CSSProperties

	inactiveItemClass: React.CSSProperties

	// Styles in inactive item
	inactiveItemStyle: React.CSSProperties

	// Styles in active item
	activeItemStyle: React.CSSProperties

	// Character styles
	charStyle: React.CSSProperties
}

const defaultProps: TextareaProps = {
	list: [] as string[],
	minChar: 2,
	char: '#',
	maxSuggest: 5,
	ssr: false,
	mode: 'infinite',
	addChar: true,
	showCharInList: true,
	acceptSpaces: false,
	spellcheck: false,
	limitToParent: false,
	activeItemClass: {},
	activeItemStyle: {},
	inactiveItemClass: {},
	inactiveItemStyle: {},
	charStyle: {},
	listClass: '',
}

const styles: any = {
	panel: {
		position: 'relative',
		outline: 'none',
		width: '100%',
		minHeight: '50px',
	},

	textarea: {
		width: '100%',
		minHeight: '50px',
		height: '80px',
		fontSize: '20px',
	},
}

const createRegExp = (character: string) => {
	// Only match with the last coincidence
	return new RegExp(`([${character}])(?:(?!\\1)[^\\s])*$`)
}

const TextareaComponent = ({
	minChar = 2,
	char = '/',
	ssr = false,
	mode = 'infinite',
	...props
}: TextareaProps) => {
	const [state, setStateBase] = useState<{
		top: number
		left: number
		match: RegExpExecArray | null
		suggests: any[]
		list: any[]
		isOpen: boolean
		activeIndex: number
		value: string
		selectionEnd: number
	}>({
		top: 0,
		left: 0,
		match: null,
		suggests: [],
		isOpen: false,
		activeIndex: 0,
		value: '',
		selectionEnd: 0,
		list: [],
	})

	const setState = (data: any) => {
		setStateBase(prevState => ({
			...prevState,
			...data,
		}))
	}

	useEffect(() => {
		if (!ssr) {
			window.addEventListener('keydown', (ev: any) => keyDown(ev))
		}

		return () => {
			window.removeEventListener('keydown', (ev: any) => keyDown(ev))
		}
	}, [state])

	const pattern = createRegExp(char)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const keyDown = (ev: KeyboardEvent) => {
		if (state.isOpen) {
			const code = ev.code

			// Down
			if (code === 'ArrowDown') down()
			// Up
			if (code === 'ArrowUp') up()
			// Enter
			if (code === 'Enter') onSelect()
		}
	}

	const up = () => {
		if (mode === 'lock') {
			const { activeIndex } = state
			if (activeIndex - 1 >= 0) {
				setState({ activeIndex: activeIndex - 1 })
			}
		}

		if (mode === 'infinite') {
			const { suggests, activeIndex } = state
			if (activeIndex - 1 >= 0) {
				setState({ activeIndex: activeIndex - 1 })
			} else {
				setState({ activeIndex: suggests.length - 1 })
			}
		}
	}

	const down = () => {
		const { suggests, activeIndex } = state

		if (mode === 'lock') {
			if (activeIndex + 1 < suggests.length) {
				setState({ activeIndex: activeIndex + 1 })
			}
		}

		if (mode === 'infinite') {
			if (activeIndex + 1 < suggests.length) {
				setState({ activeIndex: activeIndex + 1 })
			} else {
				setState({ activeIndex: 0 })
			}
		}
	}

	const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const textarea = event.target
		// debugger
		const { selectionEnd, value } = textarea
		const pos = getCaretCoordinates(textarea, selectionEnd)
		setState({ ...pos, value })
		const match = pattern.exec(value.slice(0, selectionEnd))
		// console.log('MATHC', match, value)

		if (match && match[0] && match[0].length >= minChar) {
			setState({ match: match[0], selectionEnd })
			// debugger
			getSuggest(match[0])
		} else {
			setState({ match: null })
		}
	}

	const onSelect = () => {
		const { suggests, activeIndex, selectionEnd, match, value } = state
		const { addChar } = props
		const select = addChar
			? char + suggests[activeIndex]
			: suggests[activeIndex]

		// It's replace value text
		const pre = value.substring(0, selectionEnd - (match?.length ?? 0)) + select
		const next = value.substring(selectionEnd)
		const newValue = pre + next
		setState({ activeIndex: 0, isOpen: false, value: newValue })
		if (textareaRef.current) {
			textareaRef.current.selectionEnd = pre.length
		}
	}

	const onKeyDown =
		(e: KeyboardEvent<HTMLTextAreaElement>) => (e: KeyboardEvent) => {
			if (state.isOpen) {
				if (
					e.code === 'ArrowUp' ||
					e.code === 'ArrowDown' ||
					e.code === 'Enter'
				) {
					e.preventDefault()
				}
			}

			if (e.code === 'Escape') {
				setState({ isOpen: false })
			}
		}

	const getSuggest = (match: string) => {
		// debugger
		const { list, maxSuggest } = props
		const tok = match.replace(char, '')
		let suggests = list.filter((sug: any) => sug.indexOf(tok) !== -1)
		// Limit
		if (suggests.length > maxSuggest) {
			suggests = suggests.slice(0, maxSuggest)
		}

		if (suggests.length) {
			setState({ suggests, isOpen: true })
		} else {
			setState({ isOpen: false })
		}
	}

	const { top, left, value, match, suggests, isOpen, activeIndex } = state
	const {  showCharInList, spellcheck } = props

	console.log(`
  match: ${match}
  isOpen: ${isOpen}
  `)

	return (
		<div style={styles.panel}>
			<Suggest
				left={left}
				top={top}
				suggests={suggests}
				isOpen={match!! && isOpen}
				activeIndex={activeIndex}
				textareaEl={textareaRef}
				char={char}
				{...props}
			/>
			<textarea
				ref={textareaRef}
				onChange={onChange}
				onKeyDown={onKeyDown}
				value={value}
				style={styles.textarea}
			/>
		</div>
	)
}

// TextareaComponent.defaultProps = defaultProps

export default TextareaComponent
