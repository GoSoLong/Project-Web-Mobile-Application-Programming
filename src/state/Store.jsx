import { createContext, useContext, useEffect, useState } from "react";
import { repository } from "../services/repository.js";
const Context = createContext(null);
export function Store({ children }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((s) => {
        if (active) setData(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!data) return;
    try {
      repository.save(data);
      setError("");
    } catch {
      setError(
        "Không thể lưu thay đổi vào trình duyệt. Trạng thái hiện tại chưa được lưu.",
      );
    }
  }, [data]);
  const update = (fn) => setData((previous) => fn(structuredClone(previous)));
  const reset = () => {
    try {
      setData(repository.reset());
      setError("");
    } catch {
      setError("Trình duyệt không cho phép lưu dữ liệu.");
    }
  };
  if (!data)
    return (
      <div className="boot">
        <h1>JourneyLink</h1>
        <p role={error ? "alert" : "status"}>
          {error || "Đang mở không gian hành trình…"}
        </p>
        {error && (
          <button className="btn primary" onClick={reset}>
            Khôi phục dữ liệu mẫu
          </button>
        )}
      </div>
    );
  const user = data.users.find((u) => u.id === data.activeUserId);
  return (
    <Context.Provider value={{ data, update, now, user, reset }}>
      {error && (
        <div className="global-error" role="alert">
          {error}
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
