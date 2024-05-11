import ReactDOM from 'react-dom/client'
import MappicsElement from './MappicsElement'
import { MappicsStore } from './MappicsStore'

const Mappics = ({id, ...props}) => {
	return (
		<MappicsStore>
			<MappicsElement {...props}/>
		</MappicsStore>
	)
}

export default Mappics

// web component
class MappicsWebComponent extends HTMLElement {
	constructor() {
		super();
		this._root = this.attachShadow({ mode: 'closed' });
	}
	
	connectedCallback() {
		if (this._root.childElementCount > 0) return;
		
		let path = './';
		const script = document.getElementById('mappics-script');
		if (script) path = script.src.substring(0, script.src.lastIndexOf('/') + 1);

		const linkElement = document.createElement('link');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('type', 'text/css');
		linkElement.setAttribute('href', path + 'mappics.css');
		this._root.appendChild(linkElement);
		
		const props = this.dataset;
		
		ReactDOM.createRoot(this._root).render(
			<MappicsStore>
				<MappicsElement {...props} />
			</MappicsStore>
		);
	}
}

customElements.define('mappics-map', MappicsWebComponent);