import { useEffect, useState } from "react";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useStore } from "../state/Store.jsx";
import { Avatar, Info, PageHeading, SectionTitle } from "../components/UI.jsx";
export default function Settings() {
  const { data, user, update, reset } = useStore();
  const [name, setName] = useState(user.name),
    [feedback, setFeedback] = useState(""),
    [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    setName(user.name);
  }, [user.id, user.name]);
  useEffect(() => {
    setFeedback("");
  }, [user.id]);
  return (
    <>
      <PageHeading
        eyebrow="PRIVACY & SETTINGS"
        title="Không gian riêng của bạn"
        description="Quản lý hồ sơ và chia sẻ theo nhu cầu của chính bạn."
      />
      <div className="settings-grid">
        <section className="panel padded">
          <SectionTitle
            title="Hồ sơ cá nhân"
            caption="Thông tin hiển thị trong bộ dữ liệu demo"
          />
          <div className="profile-preview">
            <Avatar user={user} size="large" />
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) {
                setFeedback("Tên không được để trống.");
                return;
              }
              update((s) => {
                s.users.find((u) => u.id === user.id).name = name.trim();
                return s;
              });
              setFeedback("Đã lưu hồ sơ vào trình duyệt.");
            }}
          >
            <label>
              Tên hiển thị
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="btn primary space-top" type="submit">
              <Save size={16} />
              Lưu thay đổi
            </button>
          </form>
          {feedback && (
            <p className="feedback" role="status">
              {feedback}
            </p>
          )}
        </section>
        <section className="panel padded">
          <SectionTitle
            title="Bạn luôn giữ quyền chủ động"
            caption="Tạm dừng cập nhật cho những người đang theo dõi bạn"
          />
          <label className="switch-row">
            <span>
              <strong>Tạm dừng chia sẻ trực tiếp</strong>
              <small>
                Khi bật, người khác không xem được vị trí trực tiếp của bạn.
                Quyền xem lịch sử vẫn giữ nguyên.
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label="Tạm dừng chia sẻ trực tiếp"
              checked={user.pauseLive}
              onChange={(e) =>
                update((s) => {
                  s.users.find((u) => u.id === user.id).pauseLive =
                    e.target.checked;
                  return s;
                })
              }
            />
          </label>
          <a className="btn space-top" href="#/sharing">
            <ShieldCheck size={16} />
            Quản lý quyền theo từng người
          </a>
        </section>
      </div>
      <section className="panel padded space-top">
        <SectionTitle
          title="Không gian trình diễn"
          caption="Chuyển hồ sơ giúp kiểm chứng quyền xem từ phía người nhận; đây không phải đăng nhập."
        />
        <label className="demo-persona">
          Hồ sơ đang trải nghiệm
          <select
            aria-label="Hồ sơ demo"
            value={user.id}
            onChange={(e) =>
              update((s) => {
                s.activeUserId = e.target.value;
                return s;
              })
            }
          >
            {data.users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <Info>
          Tất cả hồ sơ và quyền đều ở phía client. Khi tích hợp API thật, máy
          chủ phải xác thực và kiểm tra quyền trước khi trả về bất kỳ tọa độ
          nào.
        </Info>
      </section>
      <section className="panel padded space-top">
        <SectionTitle
          title="Khôi phục dữ liệu mẫu"
          caption="Xóa các thay đổi của bản demo JourneyLink trên trình duyệt này và tạo lại bộ mẫu. Không ảnh hưởng dữ liệu khác."
        />
        {!confirmReset ? (
          <button className="btn" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} />
            Đặt lại bản demo
          </button>
        ) : (
          <div className="reset-confirm">
            <p>Bạn muốn xóa thay đổi trong bản demo JourneyLink?</p>
            <button
              className="btn primary"
              onClick={() => {
                reset();
                setConfirmReset(false);
                setFeedback("Đã khôi phục bộ dữ liệu mẫu.");
              }}
            >
              Xác nhận khôi phục
            </button>
            <button className="btn" onClick={() => setConfirmReset(false)}>
              Giữ lại dữ liệu
            </button>
          </div>
        )}
      </section>
    </>
  );
}
