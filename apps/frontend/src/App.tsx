import { Issue } from "./Components/Issues";
import { Landing } from "./Components/Landing";
import "./index.css";
import {BrowserRouter,Route, Routes} from "react-router-dom"
import { Auth } from "./Pages/Auth";
import { Dashboard } from "./Pages/Dashboard";
export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing/>} />
				<Route path="/auth/:auth" element={<Auth/>} />
				<Route path="/dashboard/:username" element={<Dashboard/>} />
				<Route path="/issues/:token" element={<Issue/>} />
				<Route path="/boards/:organizationId" element={<Issue/>} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;