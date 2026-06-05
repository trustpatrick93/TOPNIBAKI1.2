import { DiaryEntry } from '../types';

/**
 * Method 2: Automatically save/download a diary entry to the local computer as a TXT file.
 */
export const downloadDiaryEntryAsTxt = (entry: DiaryEntry): void => {
  try {
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '-').replace(/\./g, '');
    
    // Convert time to HHMMSS string for the file title
    const timeFull = dateObj.toTimeString().split(' ')[0]; // e.g. "14:23:45"
    const timeStr = timeFull.replace(/:/g, ''); 
    const filename = `톱니바퀴_일지_${dateStr}_${timeStr}.txt`;

    const txtContent = `=======================================================
[톱니바퀴 스케줄러 - 나의 소중한 일지 영구소장 백업용]
=======================================================

■ 작성 일시: ${dateObj.toLocaleString('ko-KR')} (KST)
■ 일지 분류: [${entry.category}]
■ 고유 식별자(ID): ${entry.id}

-------------------------------------------------------
[일지 본문 내용]
-------------------------------------------------------
${entry.content}

-------------------------------------------------------
본 파일은 일지가 등록될 때 로컬 컴퓨터에 안전하게 자동 저장된 백업 텍스트 파일입니다.
만약 클라우드나 브라우저 상태 초기화로 데이터가 소실되는 경우,
이 파일을 활용하여 Cogwheel 스케줄러 일지를 즉시 복구할 수 있습니다.
=======================================================`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`[LOCAL BACKUP] Successfully downloaded backup TXT for entry ${entry.id}`);
  } catch (err) {
    console.error("[LOCAL BACKUP] Local copy automatic download failed:", err);
  }
};

/**
 * Method 1: Upload a diary entry to the user's Microsoft OneDrive in real-time.
 */
export const uploadDiaryToOneDrive = async (
  entry: DiaryEntry,
  accessToken: string,
  folderName: string = "Cogwheel_Diary_Backup"
): Promise<{ success: boolean; error?: string; status?: number }> => {
  try {
    const dateObj = new Date(entry.createdAt);
    const dateStr = dateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '-').replace(/\./g, '');
    
    const timeFull = dateObj.toTimeString().split(' ')[0];
    const timeStr = timeFull.replace(/:/g, '');
    const filename = `톱니바퀴_일지_${dateStr}_${timeStr}.txt`;

    const txtContent = `=======================================================
[톱니바퀴 스케줄러 - 나의 소중한 일지 영구소장 백업용]
=======================================================

■ 작성 일시: ${dateObj.toLocaleString('ko-KR')} (KST)
■ 일지 분류: [${entry.category}]
■ 고유 식별자(ID): ${entry.id}

-------------------------------------------------------
[일지 본문 내용]
-------------------------------------------------------
${entry.content}

-------------------------------------------------------
본 파일은 일지가 등록될 때 마이크로소프트 원드라이브(OneDrive)에 안전하게 실시간 동기화 백업된 정식 파일입니다.
=======================================================`;

    // Standard MS Graph Endpoint for uploading binary/text contents directly
    // PUT /me/drive/root:/{folder-path}/{filename}:/content
    const cleanFolder = folderName.trim().replace(/^\/+|\/+$/g, ''); // strip leading/trailing slashes
    const folderPath = cleanFolder ? `${encodeURIComponent(cleanFolder)}/` : '';
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}${encodeURIComponent(filename)}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body: txtContent
    });

    if (response.ok) {
      console.log(`[ONEDRIVE BACKUP] Successfully uploaded entry ${entry.id} to OneDrive!`);
      return { success: true };
    } else {
      const errText = await response.text();
      console.error("[ONEDRIVE BACKUP] Upload returned failure status:", response.status, errText);
      return { success: false, status: response.status, error: errText };
    }
  } catch (err: any) {
    console.error("[ONEDRIVE BACKUP] HTTP Request failed:", err);
    return { success: false, error: err?.message || String(err) };
  }
};
