import Mention from '@tiptap/extension-mention';

export const DocumentLinkExtension = Mention.configure({
  HTMLAttributes: {
    class: 'document-link',
    style: 'color: #0066cc; background-color: #f0f7ff; padding: 2px 4px; border-radius: 4px; cursor: pointer; text-decoration: underline;',
  },
  suggestion: {
    char: '[[',
    items: ({ query }) => {
      const allNotes = [
        'Sổ tay Cá nhân', 
        'Nhật ký 2026', 
        'Ý tưởng khởi nghiệp', 
        'Họp giao ban (Tuần 42)', 
        'Thiết kế hệ thống NoteGravity'
      ];
      return allNotes
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    },
    render: () => {
      let popup: HTMLDivElement | null = null;

      return {
        onStart: (props: any) => {
          popup = document.createElement('div');
          popup.className = 'mention-popup';
          popup.style.position = 'absolute';
          popup.style.background = 'white';
          popup.style.border = '1px solid #ccc';
          popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
          popup.style.zIndex = '9999';
          popup.style.padding = '4px';
          popup.style.borderRadius = '4px';
          document.body.appendChild(popup);
          
          const updatePopup = (props: any) => {
             if (!popup) return;
             popup.innerHTML = '';
             if (props.items.length === 0) {
               popup.style.display = 'none';
               return;
             }
             popup.style.display = 'block';
             
             props.items.forEach((item: string, index: number) => {
               const div = document.createElement('div');
               div.innerText = item;
               div.style.padding = '4px 8px';
               div.style.cursor = 'pointer';
               div.style.backgroundColor = 'transparent';
               
               div.onmouseenter = () => { div.style.backgroundColor = '#f0f0f0'; };
               div.onmouseleave = () => { div.style.backgroundColor = 'transparent'; };
               
               div.onclick = () => {
                 props.command({ id: item, label: item });
               };
               popup?.appendChild(div);
             });
             
             const rect = props.clientRect?.();
             if (rect && popup) {
               popup.style.left = `${rect.left}px`;
               popup.style.top = `${rect.bottom + 5}px`;
             }
          };
          updatePopup(props);
        },
        onUpdate: (props: any) => {
          if (!popup) return;
          popup.innerHTML = '';
          if (props.items.length === 0) {
            popup.style.display = 'none';
            return;
          }
          popup.style.display = 'block';

          props.items.forEach((item: string, index: number) => {
            const div = document.createElement('div');
            div.innerText = item;
            div.style.padding = '4px 8px';
            div.style.cursor = 'pointer';
            div.style.backgroundColor = 'transparent';
            
            div.onmouseenter = () => { div.style.backgroundColor = '#f0f0f0'; };
            div.onmouseleave = () => { div.style.backgroundColor = 'transparent'; };
            
            div.onclick = () => {
              props.command({ id: item, label: item });
            };
            popup?.appendChild(div);
          });
          const rect = props.clientRect?.();
          if (rect && popup) {
             popup.style.left = `${rect.left}px`;
             popup.style.top = `${rect.bottom + 5}px`;
          }
        },
        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            popup?.remove();
            popup = null;
            return true;
          }
          // Simple Enter handling (always picks first item if any)
          if (props.event.key === 'Enter') {
             if (props.items.length > 0) {
               props.command({ id: props.items[0], label: props.items[0] });
               return true;
             }
          }
          return false;
        },
        onExit: () => {
          popup?.remove();
          popup = null;
        },
      };
    },
  },
});
