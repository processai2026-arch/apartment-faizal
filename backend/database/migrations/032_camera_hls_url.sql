-- Browser-playable live view for CCTV.
--
-- rtsp_url is the camera's native stream but RTSP cannot play in a browser.
-- hls_url holds a browser-playable stream (an HLS .m3u8 produced from the RTSP
-- source by an NVR / go2rtc / MediaMTX, or an MJPEG endpoint). The CameraManagement
-- live view plays it with the already-bundled hls.js (or an <img> for MJPEG).
ALTER TABLE camera_devices ADD COLUMN hls_url TEXT;
