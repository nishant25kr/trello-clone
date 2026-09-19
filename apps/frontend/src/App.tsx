import { Issue } from "./Components/Issues";
import { Landing } from "./Components/Landing";
import "./index.css";
import {BrowserRouter,Route,Router, Routes} from "react-router-dom"
import { Home } from "./Pages/Home";
export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing/>} />
				<Route path="/home" element={<Home/>} />
				<Route path="/issues/:token" element={<Issue/>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;